import { GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login";

// import { login } from "./actions";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-[#e8eee3] relative hidden lg:block m-10 rounded-xl overflow-hidden">
        {/* <img
          src="/image.png"
          alt="Image"
          className="absolute inset-0 pt-30 w-full object-center"
          
        /> */}

        <div className="absolute inset-0 bg-gradient-to-l to-transparent via-black/10 via-60% from-black/30"></div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex justify-center flex-col "><div className="w-10 h-10">
            <img
          src="/image.png"
          alt="Image"
          className="object-center"
          
        />
          </div>
          <div className="w-full max-w-xs">
            <LoginForm  />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
