export default function HomePage() {
	return (
		<div className="flex flex-col items-center justify-center h-screen text-center">
			<h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
				به سیستم مدیریت نمرات خوش آمدید
			</h1>
			<p className="text-lg text-gray-200 mt-2">
				برای استفاده از سامانه، ابتدا وارد شوید یا ثبت‌نام کنید
			</p>
			<div className="mt-6 space-x-4">
				<a
					href="/login"
					className="px-6 py-3 bg-white text-blue-600 rounded-xl shadow-md hover:bg-blue-100 transition">
					ورود
				</a>
				<a
					href="/register"
					className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition">
					ثبت‌نام
				</a>
			</div>
		</div>
	);
}
