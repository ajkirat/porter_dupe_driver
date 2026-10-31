import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of use" };

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[add contact email]";

// DRAFT. Have this reviewed by a qualified person before launch.
export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6 text-stone-800">
      <h1 className="text-2xl font-bold">Pikop Driver: Terms of use</h1>
      <p className="text-sm text-stone-500">Draft, last updated 31 October 2026.</p>

      <h2 className="text-lg font-semibold">What Pikop is</h2>
      <p>Pikop connects people who want a parcel moved with independent drivers. Drivers are not our employees. We provide the app and charge drivers a flat pass fee. We do not take a share of fares.</p>

      <h2 className="text-lg font-semibold">Your account</h2>
      <p>Give true details and real documents. Do not share your account. We may refuse or remove a driver whose documents are not valid or who breaks these terms.</p>

      <h2 className="text-lg font-semibold">Rules for jobs</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Carry only lawful items. Do not carry anything illegal, dangerous or that you are not allowed to carry.</li>
        <li>Follow traffic laws, wear a helmet, and keep your vehicle, licence and insurance valid.</li>
        <li>Confirm pickup and delivery with the OTPs. Collect the fare from the customer at the point shown in the app.</li>
        <li>Do not open, damage or keep a parcel.</li>
      </ul>

      <h2 className="text-lg font-semibold">Passes and fees</h2>
      <p>You need an active pass to go online. Pass fees are shown in the app and are not refundable once the pass has started, unless the law says otherwise.</p>

      <h2 className="text-lg font-semibold">Liability</h2>
      <p>Drivers are responsible for the parcels they carry and for their own vehicle, insurance and taxes. [Have a qualified person complete this section: loss, damage and insurance.]</p>

      <h2 className="text-lg font-semibold">Contact</h2>
      <p>{CONTACT}</p>
    </main>
  );
}
