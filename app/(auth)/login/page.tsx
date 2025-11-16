import { SignIn } from "@/components/auth/sign-in"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到你的账户
          </h2>
        </div>
        <SignIn />
      </div>
    </div>
  )
}

