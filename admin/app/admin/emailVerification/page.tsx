export default function EmailVerificationPage() {
  return (
    <div className="flex flex-col justify-center items-center p-10 ">
      <div className="flex flex-col gap-2 pb-10 pl-5">
        <div className="font-bold text-2xl text-blue-800 text-center">
          Email Verification
        </div>
        <div className="text-medium">
          Check your email for a verification link.
        </div>
      </div>
      <img
        className="w-50 rotate-30"
        src={"/email.png"}
        alt="Email verification"
      />
    </div>
  );
}
