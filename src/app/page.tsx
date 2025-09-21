export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Tutoring Calendar
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Your Tutoring Platform</h2>
          <p className="text-gray-600 mb-4">
            Manage appointments, assignments, and student progress all in one place.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Calendar</h3>
              <p className="text-sm text-gray-600">View and book appointments</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Assignments</h3>
              <p className="text-sm text-gray-600">Manage tasks and progress</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-gray-600">Stay updated with reminders</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
