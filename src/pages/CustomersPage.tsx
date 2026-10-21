import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { PackageBadge, PropertyStatusBadge } from '../components/common/Badge';
import { Users, Search, Phone, Mail, Home, ChevronRight, UserPlus } from 'lucide-react';

interface CustomersPageProps {
  onNavigate: (view: string, id?: string) => void;
  onSelectProperty: (propertyId: string) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ 
  onNavigate, 
  onSelectProperty 
}) => {
  const { properties } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique customers from properties
  const customers = properties.map(p => ({
    customerId: p.customerId,
    name: p.customerName,
    phone: p.customerPhone,
    email: p.customerEmail,
    propertyId: p.id,
    unitNumber: p.unitNumber,
    projectName: p.projectName,
    packageType: p.packageType,
    status: p.status,
    progress: p.overallProgress,
    deliveryDate: p.currentEstimatedDate
  }));

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>Customer Directory & Ownership Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered homeowners, unit allotments, contact records, and contracted finish packages
          </p>
        </div>

        <button
          onClick={() => onNavigate('properties')}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer Record</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search homebuyer name, phone number, email, or unit..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Homebuyer</th>
                <th className="px-5 py-3.5 font-semibold">Contact Info</th>
                <th className="px-5 py-3.5 font-semibold">Allotted Residence</th>
                <th className="px-5 py-3.5 font-semibold">Contract Package</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Target Delivery</th>
                <th className="px-5 py-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(customer => (
                <tr
                  key={customer.customerId}
                  onClick={() => {
                    onSelectProperty(customer.propertyId);
                    onNavigate('property-detail', customer.propertyId);
                  }}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{customer.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{customer.customerId}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[170px]">{customer.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{customer.unitNumber}</div>
                    <div className="text-[11px] text-slate-500">{customer.projectName}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <PackageBadge packageType={customer.packageType} />
                  </td>
                  <td className="px-5 py-3.5">
                    <PropertyStatusBadge status={customer.status} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-700 font-semibold">
                    {customer.deliveryDate}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
