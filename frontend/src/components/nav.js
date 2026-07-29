import {
  FiGrid, FiUsers, FiLayers, FiBriefcase, FiFolder, FiCheckSquare,
  FiFlag, FiClock, FiClipboard, FiCalendar, FiVideo, FiDollarSign,
  FiFileText, FiBell, FiBarChart2, FiHardDrive, FiSettings, FiUserCheck,
  FiHome, FiShield, FiUserPlus,
} from 'react-icons/fi';

/** Navigation for a company workspace (Company Admin and employees). */
export const navSections = [
  {
    title: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', to: '/', icon: FiGrid },
    ],
  },
  {
    title: 'Organization',
    items: [
      { key: 'employees', label: 'Employees', to: '/employees', icon: FiUsers },
      { key: 'teams', label: 'Teams', to: '/teams', icon: FiUserPlus },
      { key: 'departments', label: 'Departments', to: '/departments', icon: FiLayers },
      { key: 'clients', label: 'Clients', to: '/clients', icon: FiBriefcase },
    ],
  },
  {
    title: 'Delivery',
    items: [
      { key: 'projects', label: 'Projects', to: '/projects', icon: FiFolder },
      { key: 'tasks', label: 'Tasks', to: '/tasks', icon: FiCheckSquare },
      { key: 'milestones', label: 'Milestones', to: '/milestones', icon: FiFlag },
      { key: 'timelogs', label: 'Time Tracking', to: '/timelogs', icon: FiClock },
    ],
  },
  {
    title: 'People Ops',
    items: [
      { key: 'attendance', label: 'Attendance', to: '/attendance', icon: FiUserCheck },
      { key: 'leaves', label: 'Leaves', to: '/leaves', icon: FiClipboard },
      { key: 'payroll', label: 'Payroll', to: '/payroll', icon: FiDollarSign },
      { key: 'contracts', label: 'Contracts', to: '/contracts', icon: FiFileText },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { key: 'meetings', label: 'Meetings', to: '/meetings', icon: FiVideo },
      { key: 'calendar', label: 'Calendar', to: '/calendar', icon: FiCalendar },
      { key: 'assets', label: 'Assets', to: '/assets', icon: FiHardDrive },
      { key: 'notifications', label: 'Notifications', to: '/notifications', icon: FiBell },
    ],
  },
  {
    title: 'Insights',
    items: [
      { key: 'reports', label: 'Reports', to: '/reports', icon: FiBarChart2 },
      { key: 'settings', label: 'Settings', to: '/settings', icon: FiSettings },
    ],
  },
];

/** Navigation for the platform Super Admin. */
export const superAdminNavSections = [
  {
    title: 'Platform',
    items: [
      { key: 'sa-dashboard', label: 'Dashboard', to: '/super-admin', icon: FiHome },
      { key: 'sa-companies', label: 'Companies', to: '/super-admin/companies', icon: FiBriefcase },
      { key: 'sa-admins', label: 'Company Admins', to: '/super-admin/admins', icon: FiShield },
    ],
  },
];
