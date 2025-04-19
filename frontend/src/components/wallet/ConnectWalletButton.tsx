'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import Image from 'next/image';

// Define button variants using class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-10 px-4 py-2",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
);

export interface ConnectWalletButtonProps extends VariantProps<typeof buttonVariants> {
  showBalance?: boolean;
  chainStatus?: 'full' | 'icon' | 'name' | 'none';
  accountStatus?: 'full' | 'address' | 'avatar' | 'none';
  label?: string;
  className?: string;
}

export function ConnectWalletButton({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  showBalance = false,
  chainStatus = 'none',
  // accountStatus is used in the component props type but not in the implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  accountStatus = 'address',
  label = 'Connect Wallet',
  className,
}: ConnectWalletButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
            className={cn(
              "flex items-center gap-2",
              fullWidth && "w-full",
              className
            )}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={cn(
                      buttonVariants({ variant, size, fullWidth }),
                      className
                    )}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {label}
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={cn(
                      buttonVariants({ variant: 'destructive', size, fullWidth }),
                      className
                    )}
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className={cn(
                  "flex items-center gap-2",
                  fullWidth && "w-full flex-col"
                )}>
                  {chainStatus !== 'none' && (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className={cn(
                        buttonVariants({ variant: 'secondary', size, fullWidth }),
                        className
                      )}
                    >
                      {chain.hasIcon && chainStatus !== 'name' && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <Image
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              width={16}
                              height={16}
                            />
                          )}
                        </div>
                      )}
                      {chainStatus !== 'icon' && chain.name}
                    </button>
                  )}

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={cn(
                      buttonVariants({ variant: 'secondary', size, fullWidth }),
                      className
                    )}
                  >
                    {account.displayName}
                    {showBalance && account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
