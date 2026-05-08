import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import { Application } from '../models/Application.js'
import { Document } from '../models/Document.js'
import { Dorm } from '../models/Dorm.js'
import { MaintenanceTicket } from '../models/MaintenanceTicket.js'
import { Notification } from '../models/Notification.js'
import { Review } from '../models/Review.js'
import { Room } from '../models/Room.js'
import { SupportTicket } from '../models/SupportTicket.js'
import { Transaction } from '../models/Transaction.js'
import { User } from '../models/User.js'
import { dormCatalog } from './dormCatalog.js'

const roomSeed = [
  {
    roomNumber: 'A-402',
    floor: '4th Floor',
    type: 'Single Room',
    seatCount: 1,
    occupiedSeats: 0,
    priceMonthly: 8500,
    amenities: ['Wi-Fi', 'AC', 'Attached Bath'],
  },
  {
    roomNumber: 'A-312',
    floor: '3rd Floor',
    type: 'Double Room',
    seatCount: 2,
    occupiedSeats: 1,
    priceMonthly: 7500,
    amenities: ['Wi-Fi', 'Study Desk'],
  },
  {
    roomNumber: 'B-118',
    floor: '1st Floor',
    type: 'Shared (4 Bed)',
    seatCount: 4,
    occupiedSeats: 2,
    priceMonthly: 5500,
    amenities: ['Wi-Fi', 'Laundry', 'Dining Access'],
  },
]

async function upsertSeedUser(email, payload) {
  const normalizedEmail = String(email).toLowerCase()
  const user = await User.findOne({ email: normalizedEmail }).select('+password')

  if (!user) {
    return User.create({
      ...payload,
      email: normalizedEmail,
    })
  }

  Object.assign(user, {
    ...payload,
    email: normalizedEmail,
  })

  await user.save()
  return user
}

async function seed() {
  await connectDatabase()

  await Promise.all([
    Application.deleteMany({}),
    Document.deleteMany({}),
    Dorm.deleteMany({}),
    MaintenanceTicket.deleteMany({}),
    Notification.deleteMany({}),
    Review.deleteMany({}),
    Room.deleteMany({}),
    SupportTicket.deleteMany({}),
    Transaction.deleteMany({}),
  ])

  const superAdmin = await upsertSeedUser('superadmin@dormdoor.com', {
    name: 'Super Admin',
    password: 'Super123!',
    role: 'superAdmin',
    accountStatus: 'active',
    paymentStatus: 'Not Submitted',
    phone: '+8801111111111',
    university: 'DormDoor University Network',
  })

  const admin = await upsertSeedUser('admin@dormdoor.com', {
    name: 'Dorm Admin',
    password: 'Admin123!',
    role: 'admin',
    accountStatus: 'active',
    paymentStatus: 'Not Submitted',
    phone: '+8801000000000',
    university: 'DormDoor University Network',
  })

  const student = await upsertSeedUser('student@dormdoor.com', {
    name: 'Alex Student',
    password: 'Student123!',
    role: 'student',
    accountStatus: 'active',
    paymentStatus: 'Pending',
    gender: 'Male',
    studentId: 'DD-2026-1001',
    phone: '+8801999999999',
    department: 'Computer Science',
    university: 'DormDoor University Network',
    address: 'Dhaka, Bangladesh',
    emergencyContact: {
      name: 'Rafiq Hasan',
      relation: 'Guardian',
      phone: '+8801888888888',
    },
  })

  const createdDorms = await Dorm.insertMany(
    dormCatalog.map((dorm) => ({
      ...dorm,
      managedBy: admin._id,
    })),
  )

  const [dormA, dormB] = createdDorms

  const createdRooms = await Room.insertMany([
    { ...roomSeed[0], dorm: dormA._id },
    { ...roomSeed[1], dorm: dormA._id },
    { ...roomSeed[2], dorm: dormB._id },
  ])

  const [roomOne] = createdRooms

  const application = await Application.create({
    student: student._id,
    dorm: dormA._id,
    room: roomOne._id,
    personalInfo: {
      fullName: student.name,
      email: student.email,
      phone: student.phone,
      studentId: student.studentId,
      department: student.department,
      university: student.university,
      gender: 'Male',
      address: student.address,
    },
    preferences: {
      preferredRoomType: 'Single Room',
      blockPreference: 'Block A',
      moveInDate: new Date(),
      specialRequests: 'Near study lounge if possible',
    },
    emergencyContact: student.emergencyContact,
    status: 'Pending',
    paymentStatus: 'Pending',
  })

  await Transaction.create({
    student: student._id,
    application: application._id,
    dorm: dormA._id,
    room: roomOne._id,
    amount: roomOne.priceMonthly,
    paymentMethod: 'bKash',
    transactionId: 'DEMO-TXN-1001',
    receiptUrl: 'https://example.com/files/payment-receipt-demo.jpg',
    status: 'Pending',
  })

  await Document.insertMany([
    {
      student: student._id,
      application: application._id,
      category: 'Student ID',
      fileName: 'student-id-card.pdf',
      fileUrl: 'https://example.com/files/student-id-card.pdf',
      status: 'Verified',
      reviewedBy: admin._id,
      reviewNote: 'Data verified successfully',
    },
    {
      student: student._id,
      application: application._id,
      category: 'Passport Photo',
      fileName: 'passport-photo.jpg',
      fileUrl: 'https://example.com/files/passport-photo.jpg',
      status: 'Pending',
    },
  ])

  await MaintenanceTicket.create({
    student: student._id,
    dorm: dormA._id,
    room: roomOne._id,
    title: 'Leaking bathroom tap',
    description: 'The bathroom tap leaks throughout the night.',
    priority: 'High',
    status: 'Pending',
    updates: [{ from: 'student', message: 'Issue reported by student.' }],
  })

  await Review.create({
    student: student._id,
    dorm: dormA._id,
    room: roomOne._id,
    rating: {
      overall: 4,
      cleanliness: 4,
      security: 5,
      internet: 4,
      maintenance: 3,
    },
    comment: 'Great environment for study, but maintenance response can be faster.',
    anonymous: false,
    status: 'Published',
  })

  await Notification.insertMany([
    {
      user: student._id,
      title: 'Welcome to DormDoor',
      message: 'Your account is ready. Complete your application to reserve a room.',
      type: 'system',
      read: false,
    },
    {
      user: admin._id,
      title: 'Seed Completed',
      message: 'Sample data has been loaded successfully.',
      type: 'system',
      read: false,
    },
    {
      user: superAdmin._id,
      title: 'Payment Review Needed',
      message: 'A sample student payment is pending super admin approval.',
      type: 'payment',
      read: false,
    },
  ])

  // eslint-disable-next-line no-console
  console.log('Seed complete')
  // eslint-disable-next-line no-console
  console.log('Super Admin Login: superadmin@dormdoor.com / Super123!')
  // eslint-disable-next-line no-console
  console.log('Admin Login: admin@dormdoor.com / Admin123!')
  // eslint-disable-next-line no-console
  console.log('Student Login: student@dormdoor.com / Student123!')

  await mongoose.connection.close()
}

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  await mongoose.connection.close()
  process.exit(1)
})
