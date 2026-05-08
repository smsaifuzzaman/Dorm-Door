import { Application } from '../models/Application.js'
import { Notification } from '../models/Notification.js'
import { Room } from '../models/Room.js'
import { cancelOtherActiveApplicationsForStudent } from './applicationLifecycleService.js'
import { sendEmail } from '../utils/email.js'

function isRoomAvailable(room) {
  if (!room) return false
  if (room.status === 'Maintenance' || room.status === 'Unavailable' || room.status === 'Full') return false
  return Number(room.occupiedSeats || 0) < Number(room.seatCount || 0)
}

function nextRoomStatus(room) {
  if (room.status === 'Maintenance' || room.status === 'Unavailable') return room.status
  if (room.occupiedSeats >= room.seatCount) return 'Full'
  if (room.occupiedSeats > 0) return 'Limited'
  return 'Open'
}

async function releaseRoomSeat(roomId) {
  const room = await Room.findByIdAndUpdate(
    roomId,
    { $inc: { occupiedSeats: -1 } },
    { new: true },
  )

  if (!room) return null
  room.occupiedSeats = Math.max(0, Number(room.occupiedSeats || 0))
  room.status = nextRoomStatus(room)
  await room.save()
  return room
}

function matchesRoom(application, room) {
  const preferredRoomType = String(application.preferences?.preferredRoomType || '').trim()

  if (preferredRoomType && preferredRoomType !== String(room.type || '')) {
    return false
  }

  return true
}

async function createPromotionNotification(application, room) {
  try {
    await Notification.create({
      user: application.student._id || application.student,
      title: 'Waitlist Promotion',
      message: `Good news! You were promoted from the waitlist to approved for room ${room.roomNumber}.`,
      type: 'application',
    })
  } catch {
    // intentionally non-blocking
  }
}

async function emailPromotion(application, room) {
  const recipient = application.personalInfo?.email || application.student?.email
  const studentName = application.personalInfo?.fullName || application.student?.name || 'Student'
  const dormName = application.dorm?.name || 'your selected dorm'

  try {
    await sendEmail({
      to: recipient,
      subject: 'Dorm Door Waitlist Update',
      text: `Hello ${studentName}, good news! A room became available and your application has been promoted from Waitlisted to Approved. Dorm: ${dormName}. Room: ${room.roomNumber}. Please log in to your Dorm Door dashboard to continue.`,
      html: `
        <p>Hello ${studentName},</p>
        <p>Good news! A room became available and your application has been promoted from <strong>Waitlisted</strong> to <strong>Approved</strong>.</p>
        <p><strong>Dorm:</strong> ${dormName}<br/><strong>Room:</strong> ${room.roomNumber}</p>
        <p>Please log in to your Dorm Door dashboard to continue.</p>
      `,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to send waitlist promotion email: ${error.message}`)
  }
}

async function findWaitlistedApplicationForRoom(room, excludedIds) {
  const waitlistedApplications = await Application.find({
    dorm: room.dorm,
    status: 'Waitlisted',
    _id: { $nin: excludedIds },
  })
    .populate('student', 'name email studentId')
    .populate('dorm', 'name block address')
    .sort({ createdAt: 1 })

  return waitlistedApplications.find((application) => matchesRoom(application, room)) || null
}

export async function promoteWaitlistedApplicantsForRoom(roomId, options = {}) {
  const excludedIds = (options.excludeApplicationIds || []).map((id) => String(id))
  const promoted = []

  while (true) {
    const room = await Room.findOne({
      _id: roomId,
      status: { $nin: ['Maintenance', 'Unavailable', 'Full'] },
      $expr: { $lt: ['$occupiedSeats', '$seatCount'] },
    })

    if (!isRoomAvailable(room)) break

    const application = await findWaitlistedApplicationForRoom(room, excludedIds)
    if (!application) break

    const claimedRoom = await Room.findOneAndUpdate(
      {
        _id: room._id,
        status: { $nin: ['Maintenance', 'Unavailable', 'Full'] },
        $expr: { $lt: ['$occupiedSeats', '$seatCount'] },
      },
      { $inc: { occupiedSeats: 1 } },
      { new: true },
    )

    if (!claimedRoom) break

    claimedRoom.status = nextRoomStatus(claimedRoom)
    await claimedRoom.save()

    const approvedApplication = await Application.findOneAndUpdate(
      { _id: application._id, status: 'Waitlisted' },
      {
        $set: {
          status: 'Approved',
          room: claimedRoom._id,
          adminNote: [
            application.adminNote,
            `Automatically promoted from waitlist on ${new Date().toLocaleString()}.`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      },
      { new: true, runValidators: true },
    )
      .populate('student', 'name email studentId')
      .populate('dorm', 'name block address')

    if (!approvedApplication) {
      await releaseRoomSeat(claimedRoom._id)
      excludedIds.push(String(application._id))
      continue
    }

    await cancelOtherActiveApplicationsForStudent(approvedApplication)
    await createPromotionNotification(approvedApplication, claimedRoom)
    await emailPromotion(approvedApplication, claimedRoom)

    promoted.push(approvedApplication)
    excludedIds.push(String(application._id))
  }

  return promoted
}

export async function promoteWaitlistedApplicantsForDorm(dormId, options = {}) {
  const availableRooms = await Room.find({
    dorm: dormId,
    status: { $nin: ['Maintenance', 'Unavailable'] },
    $expr: { $lt: ['$occupiedSeats', '$seatCount'] },
  }).sort({ roomNumber: 1 })

  const promoted = []
  const excludedIds = [...(options.excludeApplicationIds || []).map((id) => String(id))]

  for (const room of availableRooms) {
    const roomPromotions = await promoteWaitlistedApplicantsForRoom(room._id, {
      excludeApplicationIds: excludedIds,
    })
    promoted.push(...roomPromotions)
    excludedIds.push(...roomPromotions.map((application) => String(application._id)))
  }

  return promoted
}
