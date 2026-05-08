import { Application } from '../models/Application.js'

export const ACTIVE_APPLICATION_STATUSES = [
  'Pending',
  'Under Review',
  'Re-upload Requested',
  'Waitlisted',
]

export async function cancelOtherActiveApplicationsForStudent(application, reason = '') {
  const studentId = application?.student?._id || application?.student
  const applicationId = application?._id

  if (!studentId || !applicationId) return { matchedCount: 0, modifiedCount: 0 }

  return Application.updateMany(
    {
      student: studentId,
      _id: { $ne: applicationId },
      status: { $in: ACTIVE_APPLICATION_STATUSES },
    },
    {
      $set: {
        status: 'Cancelled',
        adminNote: reason || 'Cancelled automatically because another dorm application was approved.',
      },
    },
  )
}
