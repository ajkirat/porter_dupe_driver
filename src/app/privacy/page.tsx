import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[add contact email]";

// DRAFT. Have this reviewed by a qualified person before launch, and keep it matching what the app really does.
export default function Privacy() {
  return (
    <main className="prose-sm mx-auto max-w-2xl space-y-4 p-6 text-stone-800">
      <h1 className="text-2xl font-bold">Pikop Driver: Privacy policy</h1>
      <p className="text-sm text-stone-500">Draft, last updated 31 October 2026.</p>

      <h2 className="text-lg font-semibold">What we collect</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li><b>Account details:</b> your name, mobile number, bike number and UPI ID.</li>
        <li><b>Verification:</b> photos of your driving licence, vehicle RC, Aadhaar (front) and yourself, and a selfie each time you go online. These are used only to check who you are.</li>
        <li><b>Location:</b> your position while you are online or on a trip, including when the app is closed or not on screen. We do not collect it while you are offline.</li>
        <li><b>Trip and payment records:</b> jobs you accept, fares, and passes you buy. Customers pay you directly; we do not handle that money.</li>
      </ul>

      <h2 className="text-lg font-semibold">Why we use it</h2>
      <p>To verify drivers, show customers where their parcel is, find jobs near you, run your pass, keep drivers and customers safe, and resolve disputes. We do not sell your data and we do not show ads.</p>

      <h2 className="text-lg font-semibold">Who else handles it</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Supabase: our database, login and file storage.</li>
        <li>Vercel: hosts the app.</li>
        <li>OpenStreetMap services: map pictures and route search receive the places being looked up.</li>
        <li>Our SMS provider: receives your mobile number to send login codes.</li>
        <li>Customers see your name, bike number, phone and live location during a trip you accepted.</li>
      </ul>

      <h2 className="text-lg font-semibold">How long we keep it</h2>
      <p>Account and verification data is kept while your account is active. Selfies and documents are deleted when you ask us to delete your account, or after [add period] of inactivity. Trip records may be kept longer where the law requires.</p>

      <h2 className="text-lg font-semibold">Your choices</h2>
      <p>You can switch offline at any time to stop location collection. You can delete your account in the app (Profile, then Delete my account), and ask us to see or correct your data by contacting us below. You can also turn off location for the app in your phone settings, but you will not be able to take jobs.</p>

      <h2 className="text-lg font-semibold">Contact</h2>
      <p>{CONTACT}</p>
    </main>
  );
}
