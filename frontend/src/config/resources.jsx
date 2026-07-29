import { format } from 'date-fns';
import Badge from '../components/Badge.jsx';

const date = (v) => (v ? format(new Date(v), 'dd MMM yyyy') : '—');
const money = (v) => (v != null ? `PKR ${Number(v).toLocaleString()}` : '—');
const ref = (obj, key = 'fullName') => obj?.[key] || obj?.name || '—';

const avatarCell = (row) => (
  <div className="flex items-center gap-3">
    <img src={row.avatar} alt="" className="h-8 w-8 rounded-full bg-slate-200" />
    <div className="leading-tight">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{row.fullName}</p>
      <p className="text-xs text-slate-400">{row.email}</p>
    </div>
  </div>
);

const opts = (arr) => arr.map((v) => ({ value: v, label: v }));

const STATUS_EMP = ['Active', 'On Leave', 'Resigned', 'Terminated', 'Probation', 'Suspended', 'Retired'];
const EMP_TYPE = ['Full Time', 'Part Time', 'Intern', 'Remote', 'Hybrid', 'Contract'];
const GENDER = ['Male', 'Female'];
const PRIORITY = ['Low', 'Medium', 'High', 'Critical'];

export const resources = {
  employees: {
    name: 'employees', title: 'Employees', singular: 'Employee',
    subtitle: 'Manage your company workforce',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'HR Manager'],
    columns: [
      { key: 'employee', label: 'Employee', render: avatarCell },
      { key: 'employeeId', label: 'ID', render: (r) => <span className="font-mono text-xs">{r.employeeId}</span> },
      { key: 'department', label: 'Department', render: (r) => ref(r.department, 'name') },
      { key: 'team', label: 'Team', render: (r) => ref(r.team, 'name') },
      { key: 'designation', label: 'Designation' },
      { key: 'salary', label: 'Salary', render: (r) => money(r.salary) },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'team', label: 'Team', optionsFrom: { resource: 'teams' } },
      { key: 'status', label: 'Status', options: opts(STATUS_EMP) },
      { key: 'gender', label: 'Gender', options: opts(GENDER) },
      { key: 'employmentType', label: 'Type', options: opts(EMP_TYPE) },
    ],
    fields: [
      { name: 'firstName', label: 'First Name', required: true },
      { name: 'lastName', label: 'Last Name', required: true },
      { name: 'fullName', label: 'Full Name', required: true, colSpan: 2 },
      { name: 'email', label: 'Company Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'text' },
      { name: 'gender', label: 'Gender', type: 'select', options: opts(GENDER), required: true },
      { name: 'team', label: 'Team', type: 'select', optionsFrom: { resource: 'teams' } },
      { name: 'phone', label: 'Phone' },
      { name: 'designation', label: 'Designation', required: true },
      { name: 'salary', label: 'Salary (PKR)', type: 'number', required: true },
      { name: 'employmentType', label: 'Employment Type', type: 'select', options: opts(EMP_TYPE) },
      { name: 'status', label: 'Status', type: 'select', options: opts(STATUS_EMP) },
      { name: 'joiningDate', label: 'Joining Date', type: 'date', required: true },
      { name: 'city', label: 'City' },
      { name: 'biography', label: 'Biography', type: 'textarea' },
    ],
  },

  teams: {
    name: 'teams', title: 'Teams', singular: 'Team',
    subtitle: 'Create and organise unlimited teams',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'HR Manager'],
    columns: [
      {
        key: 'name',
        label: 'Team',
        render: (r) => (
          <div className="flex items-center gap-3">
            <span
              className="h-8 w-8 rounded-lg shrink-0"
              style={{ backgroundColor: r.color || '#2563EB' }}
            />
            <div className="leading-tight">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{r.name}</p>
              {r.code && <p className="text-xs text-slate-400 font-mono">{r.code}</p>}
            </div>
          </div>
        ),
      },
      { key: 'lead', label: 'Team Lead', render: (r) => ref(r.lead) },
      { key: 'department', label: 'Department', render: (r) => ref(r.department, 'name') },
      { key: 'headcount', label: 'Members', render: (r) => r.members?.length ?? r.headcount ?? 0 },
      { key: 'isActive', label: 'Status', render: (r) => <Badge value={r.isActive ? 'Active' : 'Inactive'} /> },
    ],
    filters: [
      { key: 'department', label: 'Department', optionsFrom: { resource: 'departments' } },
    ],
    fields: [
      { name: 'name', label: 'Team Name', required: true, colSpan: 2 },
      { name: 'code', label: 'Code' },
      { name: 'color', label: 'Colour', type: 'color' },
      { name: 'lead', label: 'Team Lead', type: 'select', optionsFrom: { resource: 'employees', labelKey: 'fullName', sort: 'fullName' } },
      { name: 'department', label: 'Department', type: 'select', optionsFrom: { resource: 'departments' } },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },

  departments: {
    name: 'departments', title: 'Departments', singular: 'Department',
    subtitle: 'Company org structure',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'HR Manager'],
    columns: [
      { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
      { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
      { key: 'head', label: 'Head', render: (r) => ref(r.head) },
      { key: 'headcount', label: 'Members' },
    ],
    fields: [
      { name: 'name', label: 'Department Name', required: true, colSpan: 2 },
      { name: 'code', label: 'Code', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },

  clients: {
    name: 'clients', title: 'Clients', singular: 'Client',
    subtitle: 'Client relationships & accounts',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'Project Manager', 'Department Head'],
    columns: [
      { key: 'name', label: 'Client', render: (r) => <span className="font-semibold">{r.name}</span> },
      { key: 'country', label: 'Country' },
      { key: 'source', label: 'Source' },
      { key: 'totalValue', label: 'Value', render: (r) => money(r.totalValue) },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'status', label: 'Status', options: opts(['Active', 'Inactive', 'Prospect', 'Lost']) },
      { key: 'source', label: 'Source', options: opts(['Upwork', 'LinkedIn', 'Freelancer', 'Direct', 'Referral', 'Other']) },
    ],
    fields: [
      { name: 'name', label: 'Client Name', required: true },
      { name: 'company', label: 'Company' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone' },
      { name: 'country', label: 'Country' },
      { name: 'source', label: 'Source', type: 'select', options: opts(['Upwork', 'LinkedIn', 'Freelancer', 'Direct', 'Referral', 'Other']) },
      { name: 'status', label: 'Status', type: 'select', options: opts(['Active', 'Inactive', 'Prospect', 'Lost']) },
      { name: 'totalValue', label: 'Total Value (PKR)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  projects: {
    name: 'projects', title: 'Projects', singular: 'Project',
    subtitle: 'Track delivery across all teams',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'Project Manager', 'Department Head'],
    columns: [
      { key: 'name', label: 'Project', render: (r) => (
        <div><p className="font-semibold">{r.name}</p><p className="text-xs text-slate-400 font-mono">{r.code}</p></div>
      ) },
      { key: 'client', label: 'Client', render: (r) => ref(r.client, 'name') },
      { key: 'manager', label: 'Manager', render: (r) => ref(r.manager) },
      { key: 'priority', label: 'Priority', render: (r) => <Badge value={r.priority} /> },
      { key: 'progress', label: 'Progress', render: (r) => (
        <div className="flex items-center gap-2 w-28">
          <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${r.progress}%` }} />
          </div>
          <span className="text-xs text-slate-500">{r.progress}%</span>
        </div>
      ) },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'status', label: 'Status', options: opts(['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled']) },
      { key: 'priority', label: 'Priority', options: opts(PRIORITY) },
    ],
    fields: [
      { name: 'name', label: 'Project Name', required: true, colSpan: 2 },
      { name: 'code', label: 'Code' },
      { name: 'category', label: 'Category' },
      { name: 'priority', label: 'Priority', type: 'select', options: opts(PRIORITY) },
      { name: 'status', label: 'Status', type: 'select', options: opts(['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled']) },
      { name: 'progress', label: 'Progress %', type: 'number' },
      { name: 'budget', label: 'Budget (PKR)', type: 'number' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'deadline', label: 'Deadline', type: 'date' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },

  tasks: {
    name: 'tasks', title: 'Tasks', singular: 'Task',
    subtitle: 'Daily work items across projects',
    columns: [
      { key: 'title', label: 'Task', render: (r) => <span className="font-semibold">{r.title}</span> },
      { key: 'project', label: 'Project', render: (r) => ref(r.project, 'name') },
      { key: 'assignee', label: 'Assignee', render: (r) => ref(r.assignee) },
      { key: 'priority', label: 'Priority', render: (r) => <Badge value={r.priority} /> },
      { key: 'dueDate', label: 'Due', render: (r) => date(r.dueDate) },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'status', label: 'Status', options: opts(['Todo', 'In Progress', 'Review', 'Done']) },
      { key: 'priority', label: 'Priority', options: opts(PRIORITY) },
    ],
    fields: [
      { name: 'title', label: 'Task Title', required: true, colSpan: 2 },
      { name: 'priority', label: 'Priority', type: 'select', options: opts(PRIORITY) },
      { name: 'status', label: 'Status', type: 'select', options: opts(['Todo', 'In Progress', 'Review', 'Done']) },
      { name: 'progress', label: 'Progress %', type: 'number' },
      { name: 'estimatedHours', label: 'Est. Hours', type: 'number' },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },

  milestones: {
    name: 'milestones', title: 'Milestones', singular: 'Milestone',
    subtitle: 'Key project checkpoints',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'Project Manager', 'Department Head'],
    columns: [
      { key: 'title', label: 'Milestone', render: (r) => <span className="font-semibold">{r.title}</span> },
      { key: 'project', label: 'Project', render: (r) => ref(r.project, 'name') },
      { key: 'dueDate', label: 'Due', render: (r) => date(r.dueDate) },
      { key: 'progress', label: 'Progress', render: (r) => `${r.progress || 0}%` },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    fields: [
      { name: 'title', label: 'Title', required: true, colSpan: 2 },
      { name: 'status', label: 'Status', type: 'select', options: opts(['Pending', 'In Progress', 'Completed']) },
      { name: 'progress', label: 'Progress %', type: 'number' },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },

  timelogs: {
    name: 'timelogs', title: 'Time Tracking', singular: 'Time Log',
    subtitle: 'Logged hours by employee',
    columns: [
      { key: 'employee', label: 'Employee', render: (r) => ref(r.employee) },
      { key: 'project', label: 'Project', render: (r) => ref(r.project, 'name') },
      { key: 'task', label: 'Task', render: (r) => ref(r.task, 'title') },
      { key: 'hours', label: 'Hours', render: (r) => `${r.hours}h` },
      { key: 'date', label: 'Date', render: (r) => date(r.date) },
      { key: 'billable', label: 'Billable', render: (r) => <Badge value={r.billable ? 'Active' : 'Low'} /> },
    ],
  },

  attendance: {
    name: 'attendance', title: 'Attendance', singular: 'Attendance',
    subtitle: 'Daily check-in records',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'HR Manager'],
    columns: [
      { key: 'employee', label: 'Employee', render: (r) => ref(r.employee) },
      { key: 'date', label: 'Date', render: (r) => date(r.date) },
      { key: 'workedHours', label: 'Hours', render: (r) => `${r.workedHours || 0}h` },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'status', label: 'Status', options: opts(['Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Holiday']) },
    ],
  },

  leaves: {
    name: 'leaves', title: 'Leave Management', singular: 'Leave',
    subtitle: 'Requests & approvals',
    columns: [
      { key: 'employee', label: 'Employee', render: (r) => ref(r.employee) },
      { key: 'type', label: 'Type' },
      { key: 'startDate', label: 'From', render: (r) => date(r.startDate) },
      { key: 'endDate', label: 'To', render: (r) => date(r.endDate) },
      { key: 'days', label: 'Days' },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'status', label: 'Status', options: opts(['Pending', 'Approved', 'Rejected', 'Cancelled']) },
      { key: 'type', label: 'Type', options: opts(['Casual', 'Sick', 'Annual', 'Unpaid', 'Maternity', 'Emergency']) },
    ],
    fields: [
      { name: 'type', label: 'Leave Type', type: 'select', options: opts(['Casual', 'Sick', 'Annual', 'Unpaid', 'Maternity', 'Emergency']), required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true },
      { name: 'days', label: 'Days', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: opts(['Pending', 'Approved', 'Rejected', 'Cancelled']) },
      { name: 'reason', label: 'Reason', type: 'textarea' },
    ],
  },

  payroll: {
    name: 'payroll', title: 'Payroll', singular: 'Payslip',
    subtitle: 'Monthly salary processing',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'Finance Manager'],
    columns: [
      { key: 'employee', label: 'Employee', render: (r) => ref(r.employee) },
      { key: 'period', label: 'Period', render: (r) => `${r.month}/${r.year}` },
      { key: 'basicSalary', label: 'Basic', render: (r) => money(r.basicSalary) },
      { key: 'netSalary', label: 'Net', render: (r) => <span className="font-semibold">{money(r.netSalary)}</span> },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'status', label: 'Status', options: opts(['Pending', 'Processed', 'Paid']) },
    ],
  },

  contracts: {
    name: 'contracts', title: 'Contracts', singular: 'Contract',
    subtitle: 'Employment agreements',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'HR Manager'],
    columns: [
      { key: 'employee', label: 'Employee', render: (r) => ref(r.employee) },
      { key: 'type', label: 'Type' },
      { key: 'startDate', label: 'Start', render: (r) => date(r.startDate) },
      { key: 'endDate', label: 'End', render: (r) => date(r.endDate) },
      { key: 'salary', label: 'Salary', render: (r) => money(r.salary) },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'status', label: 'Status', options: opts(['Active', 'Expired', 'Terminated', 'Renewed']) },
      { key: 'type', label: 'Type', options: opts(['Permanent', 'Fixed Term', 'Internship', 'Probation']) },
    ],
  },

  meetings: {
    name: 'meetings', title: 'Meetings', singular: 'Meeting',
    subtitle: 'Scheduled team & client meetings',
    columns: [
      { key: 'title', label: 'Meeting', render: (r) => <span className="font-semibold">{r.title}</span> },
      { key: 'organizer', label: 'Organizer', render: (r) => ref(r.organizer) },
      { key: 'startTime', label: 'Start', render: (r) => date(r.startTime) },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'status', label: 'Status', options: opts(['Scheduled', 'Completed', 'Cancelled']) },
    ],
    fields: [
      { name: 'title', label: 'Title', required: true, colSpan: 2 },
      { name: 'agenda', label: 'Agenda', type: 'textarea' },
      { name: 'startTime', label: 'Start Time', type: 'date', required: true },
      { name: 'location', label: 'Location' },
      { name: 'meetingLink', label: 'Meeting Link' },
      { name: 'status', label: 'Status', type: 'select', options: opts(['Scheduled', 'Completed', 'Cancelled']) },
    ],
  },

  assets: {
    name: 'assets', title: 'Assets', singular: 'Asset',
    subtitle: 'Company equipment inventory',
    writeRoles: ['Company Admin', 'Super Admin', 'CEO', 'HR Manager'],
    columns: [
      { key: 'name', label: 'Asset', render: (r) => <span className="font-semibold">{r.name}</span> },
      { key: 'category', label: 'Category' },
      { key: 'assignedTo', label: 'Assigned To', render: (r) => ref(r.assignedTo) },
      { key: 'cost', label: 'Cost', render: (r) => money(r.cost) },
      { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ],
    filters: [
      { key: 'category', label: 'Category', options: opts(['Laptop', 'Desktop', 'Monitor', 'Phone', 'Furniture', 'Peripheral', 'Other']) },
      { key: 'status', label: 'Status', options: opts(['Available', 'Assigned', 'Under Repair', 'Retired']) },
    ],
    fields: [
      { name: 'name', label: 'Asset Name', required: true, colSpan: 2 },
      { name: 'tag', label: 'Asset Tag' },
      { name: 'category', label: 'Category', type: 'select', options: opts(['Laptop', 'Desktop', 'Monitor', 'Phone', 'Furniture', 'Peripheral', 'Other']) },
      { name: 'serialNumber', label: 'Serial Number' },
      { name: 'cost', label: 'Cost (PKR)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: opts(['Available', 'Assigned', 'Under Repair', 'Retired']) },
      { name: 'condition', label: 'Condition', type: 'select', options: opts(['New', 'Good', 'Fair', 'Poor']) },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
    ],
  },

  notifications: {
    name: 'notifications', title: 'Notifications', singular: 'Notification',
    subtitle: 'System & activity notifications',
    columns: [
      { key: 'title', label: 'Title', render: (r) => <span className="font-semibold">{r.title}</span> },
      { key: 'message', label: 'Message' },
      { key: 'type', label: 'Type', render: (r) => <Badge value={r.type} /> },
      { key: 'isRead', label: 'Read', render: (r) => (r.isRead ? 'Yes' : 'No') },
      { key: 'createdAt', label: 'Date', render: (r) => date(r.createdAt) },
    ],
  },
};
