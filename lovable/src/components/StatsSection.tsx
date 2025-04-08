
import React from 'react';
import { ArrowUpRight, TrendingUp, Shield, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const StatsSection = () => {
  return (
    <section id="stats" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform Statistics</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real-time insights into our growing ecosystem of tokenized insurance policies and capital efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Value Locked" 
            value="$18.7M" 
            change="+12.5%" 
            icon={<TrendingUp className="h-6 w-6" />}
            description="Total value of insurance policies"
          />
          
          <StatCard 
            title="Active Borrowers" 
            value="1,247" 
            change="+7.8%" 
            icon={<Users className="h-6 w-6" />}
            description="Users with active loans"
          />
          
          <StatCard 
            title="Tokenized Policies" 
            value="3,582" 
            change="+15.3%" 
            icon={<Shield className="h-6 w-6" />}
            description="Insurance NFTs created"
          />
          
          <StatCard 
            title="Total Borrowed" 
            value="$12.5M" 
            change="+9.2%" 
            icon={<ArrowUpRight className="h-6 w-6" />}
            description="USDC borrowed against NFTs"
          />
        </div>

        <div className="mt-12 text-center">
          <a href="#" className="inline-flex items-center text-quickfi-blue hover:text-quickfi-darkBlue font-medium">
            View full analytics dashboard
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  description: string;
}

const StatCard = ({ title, value, change, icon, description }: StatCardProps) => {
  return (
    <Card className="glass-card hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-600">{title}</h3>
          <div className="p-2 rounded-full bg-blue-100 text-quickfi-blue">
            {icon}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-quickfi-slate">{value}</span>
            <span className="ml-2 text-sm font-medium text-emerald-600">{change}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsSection;
