import { FlaskConical, Search } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center space-y-10">

        {/* Logo / icon area */}
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <FlaskConical className="w-10 h-10 text-gray-700" strokeWidth={1.5} />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            PBL Question Lab
          </h1>
          <p className="text-xl font-medium text-gray-700 leading-relaxed">
            הופכים נושא לימודי לשאלת PBL שאי אפשר לפתור עם תשובה מגוגל.
          </p>
          <p className="text-base text-gray-500 leading-relaxed max-w-xl mx-auto">
            PBL Question Lab עוזר למורים לבנות, לבדוק ולשפר שאלות גדולות שמחזיקות חקר, דילמה, תוכן ותוצר משמעותי.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors duration-150"
          >
            <FlaskConical className="w-5 h-5" strokeWidth={1.5} />
            צור שאלות PBL
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-base font-medium hover:bg-gray-50 transition-colors duration-150"
          >
            <Search className="w-5 h-5" strokeWidth={1.5} />
            אבחן שאלה קיימת
          </button>
        </div>
      </div>
    </main>
  )
}
