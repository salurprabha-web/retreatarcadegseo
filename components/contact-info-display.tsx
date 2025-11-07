'use client';

import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactInfoDisplayProps {
  email: string;
  phone: string;
  address: string;
}

export function ContactInfoDisplay({ email, phone, address }: ContactInfoDisplayProps) {
  return (
    <div className="space-y-6">
      {email && (
        <div>
          <div className="flex items-center mb-3">
            <div className="bg-orange-100 p-3 rounded-full mr-4">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email</h3>
              <a
                href={`mailto:${email}`}
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                {email}
              </a>
            </div>
          </div>
        </div>
      )}

      {phone && (
        <div>
          <div className="flex items-center mb-3">
            <div className="bg-orange-100 p-3 rounded-full mr-4">
              <Phone className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Phone</h3>
              <a
                href={`tel:${phone}`}
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                {phone}
              </a>
            </div>
          </div>
        </div>
      )}

      {address && (
        <div>
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full mr-4">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Location</h3>
              <p className="text-gray-600">{address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
