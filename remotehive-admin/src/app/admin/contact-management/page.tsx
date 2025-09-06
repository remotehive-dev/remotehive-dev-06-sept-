import React from 'react';
import ContactManagement from '@/components/features/contact/contactmanagement';

const ContactManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <ContactManagement />
    </div>
  );
};

export default ContactManagementPage;

export const metadata = {
  title: 'Contact Management - RemoteHive Admin',
  description: 'Manage and respond to contact form submissions',
};