"use client";

import { ContactInfoManagement } from "@/components/features/contact/ContactInfoManagement";

export default function ContactInfoManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Contact Information Management
        </h1>
        <p className="text-gray-600">
          Manage your company's contact information displayed on the website.
        </p>
      </div>
      <ContactInfoManagement />
    </div>
  );
}