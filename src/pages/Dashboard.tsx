import { Link } from "react-router-dom";
import {
  Users,
  Wallet,
  ArrowUpRight,
  Calendar,
  Check,
  User,
  Database,
  ChevronRight,
  ArrowUp,
  Zap,
} from "lucide-react";

interface StatItem {
  id: string;
  title: string;
  value: string;
  change: string;
  changePeriod: string;
  icon: typeof Wallet;
  iconBg: string;
  iconColor: string;
}

interface GroupItem {
  id: string;
  name: string;
  membersCount: number;
  amountCadence: string;
  paidCount: number;
  totalCount: number;
  paidTextLeft: string;
  paidTextRight: string;
  nextPayoutDate: string;
  colorScheme: {
    avatarBg: string;
    avatarText: string;
  };
}

interface PayoutItem {
  id: string;
  name: string;
  groupName: string;
  amount: string;
  date: string;
  avatar: string;
  badgeStyle: string;
}

interface ActivityItem {
  id: string;
  title: string;
  details: string;
  icon: typeof ArrowUp;
  iconBg: string;
}

export default function Dashboard() {
  const stats: StatItem[] = [
    {
      id: "contributions",
      title: "Total Contributions",
      value: "₦320,000",
      change: "↑ 12%",
      changePeriod: "vs last month",
      icon: Database,
      iconBg: "bg-[#e6f7ef]",
      iconColor: "text-[#059669]",
    },
    {
      id: "groups",
      title: "Active Groups",
      value: "4",
      change: "↑ 1",
      changePeriod: "new this month",
      icon: Users,
      iconBg: "bg-[#eff6ff]",
      iconColor: "text-[#2563eb]",
    },
    {
      id: "members",
      title: "Total Members",
      value: "28",
      change: "↑ 3",
      changePeriod: "new this month",
      icon: Users,
      iconBg: "bg-[#f5f3ff]",
      iconColor: "text-[#7c3aed]",
    },
    {
      id: "payouts",
      title: "Pending Payouts",
      value: "₦150,000",
      change: "↑ 1",
      changePeriod: "upcoming",
      icon: Wallet,
      iconBg: "bg-[#fff7ed]",
      iconColor: "text-[#ea580c]",
    },
  ];

  const groups: GroupItem[] = [
    {
      id: "family-ajo",
      name: "Family Ajo",
      membersCount: 12,
      amountCadence: "₦20,000 / month",
      paidCount: 8,
      totalCount: 12,
      paidTextLeft: "8/12 paid",
      paidTextRight: "8/12 paid",
      nextPayoutDate: "Apr 25, 2025",
      colorScheme: {
        avatarBg: "bg-[#e6f7ef]",
        avatarText: "text-[#059669]",
      },
    },
    {
      id: "friends-circle",
      name: "Friends Circle",
      membersCount: 8,
      amountCadence: "₦15,000 / month",
      paidCount: 5,
      totalCount: 8,
      paidTextLeft: "5/8 paid",
      paidTextRight: "4/6 paid",
      nextPayoutDate: "May 10, 2025",
      colorScheme: {
        avatarBg: "bg-[#f3e8ff]",
        avatarText: "text-[#9333ea]",
      },
    },
    {
      id: "workmates-ajo",
      name: "Workmates Ajo",
      membersCount: 6,
      amountCadence: "₦10,000 / month",
      paidCount: 4,
      totalCount: 6,
      paidTextLeft: "4/6 paid",
      paidTextRight: "4/6 paid",
      nextPayoutDate: "May 18, 2025",
      colorScheme: {
        avatarBg: "bg-[#eff6ff]",
        avatarText: "text-[#2563eb]",
      },
    },
    {
      id: "church-ajo",
      name: "Church Ajo",
      membersCount: 10,
      amountCadence: "₦25,000 / month",
      paidCount: 7,
      totalCount: 10,
      paidTextLeft: "7/10 paid",
      paidTextRight: "7/10 paid",
      nextPayoutDate: "May 30, 2025",
      colorScheme: {
        avatarBg: "bg-[#ffe4e6]",
        avatarText: "text-[#e11d48]",
      },
    },
  ];

  const upcomingPayouts: PayoutItem[] = [
    {
      id: "chinedu",
      name: "Chinedu Okafor",
      groupName: "Family Ajo",
      amount: "₦20,000",
      date: "Apr 25, 2025",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
      badgeStyle: "bg-[#eaf8f1] text-[#059669]",
    },
    {
      id: "adaobi",
      name: "Adaobi Nwosu",
      groupName: "Friends Circle",
      amount: "₦15,000",
      date: "May 10, 2025",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80",
      badgeStyle: "bg-[#eff6ff] text-[#2563eb]",
    },
    {
      id: "emeka",
      name: "Emeka Johnson",
      groupName: "Workmates Ajo",
      amount: "₦10,000",
      date: "May 18, 2025",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
      badgeStyle: "bg-[#f5f3ff] text-[#7c3aed]",
    },
    {
      id: "ngozi",
      name: "Ngozi Eze",
      groupName: "Church Ajo",
      amount: "₦25,000",
      date: "May 30, 2025",
      avatar:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=120&h=120&q=80",
      badgeStyle: "bg-[#fff1f2] text-[#e11d48]",
    },
  ];

  const recentActivities: ActivityItem[] = [
    {
      id: "act-1",
      title: "You made a contribution to Family Ajo",
      details: "₦20,000  •  2 hours ago",
      icon: ArrowUpRight,
      iconBg: "bg-[#10b981] text-white",
    },
    {
      id: "act-2",
      title: "Adaobi Nwosu joined Friends Circle",
      details: "4 hours ago",
      icon: User,
      iconBg: "bg-[#3b82f6] text-white",
    },
    {
      id: "act-3",
      title: "Payout completed for Chinedu Okafor",
      details: "₦20,000  •  1 day ago",
      icon: Check,
      iconBg: "bg-[#10b981] text-white",
    },
    {
      id: "act-4",
      title: "You made a contribution to Church Ajo",
      details: "₦25,000  •  2 days ago",
      icon: Database,
      iconBg: "bg-[#10b981] text-white",
    },
  ];

  return (
    <div className="max-w-12/12 mx-auto space-y-6 w-full ">
      {/* Top Header Section: Greeting + Motivational Quote Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Greeting */}
        <div>
          <h1 className="text-2xl  sm:text-[32px] font-bold tracking-tight text-gray-900 leading-tight">
            Good morning,
            <br />
            God&apos;spower <span className="inline-block">👋</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-gray-500 mt-1 font-normal">
            Here&apos;s what&apos;s happening with your savings journey today.
          </p>
        </div>

        {/* Right: Motivational Illustration Card */}
        <div className="relative overflow-hidden bg-[#eaf7f1] border border-emerald-100/70 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-2xs w-full lg:w-[420px] shrink-0">
          <div className="z-10">
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              Small contributions
              <br />
              make big dreams happen.
            </p>
            <div className="h-[2.5px] w-8 bg-[#047857] rounded-full mt-2.5" />
          </div>

          {/* Plant & Coins Illustration */}
          <div className="relative shrink-0 w-24 h-16 flex items-center justify-end">
            <svg
              className="w-24 h-16"
              viewBox="0 0 110 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Soft background glow */}
              <circle cx="78" cy="40" r="26" fill="#c7f3de" fillOpacity="0.7" />

              {/* Plant Stem */}
              <path
                d="M74 48 C74 34 78 22 86 10"
                stroke="#047857"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Top Big Leaf */}
              <path
                d="M86 10 C91 6 101 8 103 16 C103 25 93 25 86 10 Z"
                fill="#059669"
              />
              <path
                d="M86 10 C89 14 96 17 101 17"
                stroke="#047857"
                strokeWidth="1"
                strokeLinecap="round"
              />
              {/* Left Side Leaf */}
              <path
                d="M77 28 C69 25 66 16 73 13 C80 10 82 20 77 28 Z"
                fill="#10b981"
              />
              {/* Right Side Leaf */}
              <path
                d="M80 35 C89 33 96 37 94 44 C91 49 84 42 80 35 Z"
                fill="#047857"
              />

              {/* Soil mound */}
              <ellipse cx="75" cy="52" rx="14" ry="4" fill="#065f46" />

              {/* Gold Coins Stack */}
              {/* Coin 1 Bottom */}
              <ellipse cx="48" cy="53" rx="10" ry="4" fill="#d97706" />
              <path
                d="M38 49.5 v3.5 C38 55.5 42.5 57 48 57 C53.5 57 58 55.5 58 53 v-3.5 Z"
                fill="#f59e0b"
              />
              <ellipse cx="48" cy="49.5" rx="10" ry="4" fill="#fbbf24" />

              {/* Coin 2 Middle */}
              <path
                d="M39 44 v3.5 C39 50 43.5 51.5 49 51.5 C54.5 51.5 59 50 59 47.5 v-3.5 Z"
                fill="#f59e0b"
              />
              <ellipse cx="49" cy="44" rx="10" ry="4" fill="#fde68a" />
              <ellipse cx="49" cy="44" rx="7" ry="2.6" stroke="#f59e0b" strokeWidth="0.8" fill="none" />

              {/* Coin 3 Leaning */}
              <ellipse
                cx="35"
                cy="46"
                rx="6.5"
                ry="8.5"
                fill="#f59e0b"
                transform="rotate(-15 35 46)"
              />
              <ellipse
                cx="35"
                cy="46"
                rx="5"
                ry="7"
                fill="#fbbf24"
                transform="rotate(-15 35 46)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div
                className={`size-11 rounded-full ${stat.iconBg} ${stat.iconColor} flex items-center justify-center`}
              >
                <Icon className="size-5" />
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">
                  {stat.value}
                </p>
              </div>

              <div className="mt-3 flex items-center text-xs">
                <span className="font-semibold text-emerald-600 flex items-center">
                  {stat.change}
                </span>
                <span className="text-gray-400 ml-1.5">{stat.changePeriod}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Left Column (My Groups) & Right Column (Upcoming Payouts + Recent Activity) */}
      <div className="grid grid-cols-1 xl:grid-cols-3  gap-6 items-start">
        {/* LEFT COLUMN: My Groups */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  My Groups
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage your Ajo groups and track contributions.
                </p>
              </div>
              <Link
                to="/groups"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                View all groups <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {/* Groups Rows */}
            <div className="divide-y divide-gray-100/70">
              {groups.map((group) => {
                const percentage = Math.round(
                  (group.paidCount / group.totalCount) * 100
                );
                return (
                  <div
                    key={group.id}
                    className="py-4.5 flex flex-col sm:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 rounded-xl px-2.5 -mx-2.5 transition-colors cursor-pointer group"
                  >
                    
                      {/* Left: Avatar + Title + Meta */}
                      <div className="flex items-center gap-3.5 min-w-[210px]">
                        <div
                          className={`size-11 rounded-full ${group.colorScheme.avatarBg} ${group.colorScheme.avatarText} flex items-center justify-center shrink-0`}
                        >
                          <Users className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-2.5 text-xs text-gray-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Users className="size-3 text-gray-400" />
                              {group.membersCount} members
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Wallet className="size-3 text-gray-400" />
                              {group.amountCadence}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Middle: Horizontal Progress Bar */}
                      <div className="flex flex-col gap-1.5 md:w-48 shrink-0">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                          <span>{group.paidTextLeft}</span>
                          <span>{group.paidTextRight}</span>
                        </div>
                      </div>
                    

                    {/* Right: Next Payout Badge & Date */}
                    <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="inline-block bg-[#eaf8f1] text-[#059669] text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                          Next Payout
                        </span>
                        <p className="text-xs font-semibold text-gray-800 mt-1">
                          {group.nextPayoutDate}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Upcoming Payouts + Recent Activity */}
        <div className="space-y-6 max-w-4xl flex flex-col lg:flex-row  xl:flex-col gap-2  ">
          {/* Upcoming Payouts Card */}
          <div className="bg-white  w-full rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#e6f7ef] text-[#059669]">
                  <Calendar className="size-4" />
                </span>
                Upcoming Payouts
              </h2>
              <Link
                to="/payouts"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 transition-colors"
              >
                View all <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {upcomingPayouts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-1"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="size-10 rounded-full object-cover shrink-0 ring-1 ring-gray-100"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {item.groupName}
                      </p>
                      <p className="text-xs font-bold text-gray-800 mt-0.5">
                        {item.amount}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${item.badgeStyle}`}
                  >
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4 ">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#e6f7ef] text-[#059669]">
                  <Zap className="size-4" />
                </span>
                Recent Activity
              </h2>
              <Link
                to="/notifications"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 transition-colors"
              >
                View all <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {recentActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 text-xs py-0.5"
                  >
                    <div
                      className={`size-9 rounded-full ${act.iconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 leading-snug">
                        {act.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {act.details}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
