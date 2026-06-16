'use client';

import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { UserStats } from '../types';

interface UsersStatsProps {
  stats?: UserStats;
  isLoading?: boolean;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card className={`relative overflow-hidden border-l-4 ${color}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && trendValue && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const StatCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  </motion.div>
);

export function UsersStats({ stats, isLoading }: UsersStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton delay={0} />
        <StatCardSkeleton delay={0.1} />
        <StatCardSkeleton delay={0.2} />
        <StatCardSkeleton delay={0.3} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total de Usuários"
        value={stats.total}
        icon={Users}
        trend="up"
        trendValue="+12.5%"
        color="border-l-blue-500"
        delay={0}
      />
      <StatCard
        title="Usuários Ativos"
        value={stats.active}
        icon={UserCheck}
        trend="up"
        trendValue="+5.2%"
        color="border-l-emerald-500"
        delay={0.1}
      />
      <StatCard
        title="Usuários Inativos"
        value={stats.inactive}
        icon={UserX}
        trend="down"
        trendValue="-2.1%"
        color="border-l-slate-500"
        delay={0.2}
      />
      <StatCard
        title="Administradores"
        value={stats.admins}
        icon={Shield}
        color="border-l-purple-500"
        delay={0.3}
      />
    </div>
  );
}
