'use client';

import { useState } from 'react';
import { CompanySelector } from '@/components/ui/company-selector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CompanySelectorTest() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEmployerId, setSelectedEmployerId] = useState('');

  const handleCompanyChange = (companyName: string, employerId?: string) => {
    console.log('Company changed:', { companyName, employerId });
    setSelectedCompany(companyName);
    setSelectedEmployerId(employerId || '');
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Company Selector Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CompanySelector
          value={selectedCompany}
          onChange={handleCompanyChange}
          placeholder="Select or create company..."
          required={true}
        />
        
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Selected Values:</h3>
          <p><strong>Company:</strong> {selectedCompany || 'None'}</p>
          <p><strong>Employer ID:</strong> {selectedEmployerId || 'None'}</p>
        </div>
      </CardContent>
    </Card>
  );
}