'use client';

import Image from 'next/image';
import { Card } from './Card';
import { Button } from './Button';

interface TokenCardProps {
  tokenId: string | number;
  policyName?: string;
  policyType?: string;
  provider?: string;
  value: number;
  expiryDate: string | Date;
  imageUrl?: string;
  contractAddress: string;
  className?: string;
  onViewDetails?: () => void;
  onUseAsCollateral?: () => void;
}

export default function TokenCard({
  tokenId,
  policyName = 'Insurance Policy',
  policyType = 'Unknown',
  provider = 'Unknown',
  value,
  expiryDate,
  imageUrl = 'https://placehold.co/300x300/3B82F6/FFFFFF?text=Policy',
  contractAddress,
  className = '',
  onViewDetails,
  onUseAsCollateral,
}: TokenCardProps) {
  // Format expiry date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format contract address to truncated form
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Calculate days until expiry
  const calculateDaysRemaining = () => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Determine if policy is expired
  const isExpired = calculateDaysRemaining() === 0;

  return (
    <Card
      className={`overflow-hidden hover:shadow-md transition-all ${className}`}
    >
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden relative">
            <Image
              src={imageUrl}
              alt={policyName}
              fill
              className="object-cover"
              sizes="64px"
              priority
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{policyName}</h3>
            <p className="text-sm text-neutral-content">
              Token ID: {tokenId}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div>
            <p className="text-neutral-content">Policy Type</p>
            <p className="font-medium">{policyType}</p>
          </div>
          <div>
            <p className="text-neutral-content">Provider</p>
            <p className="font-medium">{provider}</p>
          </div>
          <div>
            <p className="text-neutral-content">Value</p>
            <p className="font-medium">${value.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-neutral-content">Expires</p>
            <p className={`font-medium ${isExpired ? 'text-error' : ''}`}>
              {formatDate(expiryDate)}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-neutral-content mb-1">Contract</p>
          <p className="text-xs font-mono bg-base-200 p-1 rounded overflow-hidden text-ellipsis">
            {formatAddress(contractAddress)}
          </p>
        </div>

        {!isExpired && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Days Until Expiry</span>
              <span>{calculateDaysRemaining()} days</span>
            </div>
            <div className="w-full bg-base-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (calculateDaysRemaining() / 365) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          {onViewDetails && (
            <Button onClick={onViewDetails} variant="outline" className="w-full">
              View Details
            </Button>
          )}
          {onUseAsCollateral && !isExpired && (
            <Button onClick={onUseAsCollateral} className="w-full">
              Use as Collateral
            </Button>
          )}
          {isExpired && (
            <div className="text-center text-error text-sm py-2 border border-error rounded">
              Policy Expired
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 