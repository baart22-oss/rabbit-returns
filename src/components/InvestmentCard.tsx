import React from 'react';

interface PackageDetails {
  title: string;
  description: string;
  price: number;
  annualReturns: number;
}

const InvestmentCard = ({ packageDetails }: { packageDetails: PackageDetails }) => {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h2 className="text-xl font-semibold">{packageDetails.title}</h2>
      <p className="text-muted-foreground mt-2">{packageDetails.description}</p>
      <p className="mt-2"><strong>Price:</strong> R{packageDetails.price}</p>
      <p><strong>Returns:</strong> {packageDetails.annualReturns}%</p>
    </div>
  );
};

export default InvestmentCard;
