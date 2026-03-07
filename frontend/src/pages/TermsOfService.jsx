import React from 'react';

const TermsOfService = () => (
  <div className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-6 text-indigo-700">Terms of Service</h1>
    <p className="mb-4 text-gray-700">Welcome to BoardingBuddy! By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.</p>
    <h2 className="text-xl font-semibold mt-8 mb-2">User Responsibilities</h2>
    <ul className="list-disc ml-6 text-gray-700 mb-4">
      <li>Provide accurate and up-to-date information</li>
      <li>Respect other users and their privacy</li>
      <li>Do not misuse the platform or engage in fraudulent activities</li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">Account Termination</h2>
    <ul className="list-disc ml-6 text-gray-700 mb-4">
      <li>We reserve the right to suspend or terminate accounts that violate our terms</li>
      <li>Users may request account deletion at any time</li>
    </ul>
    <h2 className="text-xl font-semibold mt-8 mb-2">Limitation of Liability</h2>
    <ul className="list-disc ml-6 text-gray-700 mb-4">
      <li>BoardingBuddy is not liable for any damages resulting from the use of our platform</li>
      <li>We do not guarantee the accuracy or availability of listings</li>
    </ul>
    <p className="mt-8 text-gray-600">For questions about these terms, contact us at <span className="text-indigo-600">support@boardingbuddy.com</span>.</p>
  </div>
);

export default TermsOfService;
