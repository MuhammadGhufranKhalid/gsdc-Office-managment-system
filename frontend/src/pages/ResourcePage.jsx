import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import ResourceForm from '../components/ResourceForm.jsx';
import { resource } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResourcePage({ config }) {
  const api = resource(config.name);
  const { user } = useAuth();
  const canWrite = !config.writeRoles || config.writeRoles.includes(user?.role);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (row) => { setEditing(row); setFormOpen(true); };

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await api.update(editing._id, data);
        toast.success(`${config.singular} updated`);
      } else {
        await api.create(data);
        toast.success(`${config.singular} created`);
      }
      setFormOpen(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title={config.title} subtitle={config.subtitle} />
      <DataTable
        key={reloadKey}
        api={api}
        columns={config.columns}
        filters={config.filters || []}
        onCreate={config.fields ? openCreate : undefined}
        onEdit={config.fields ? openEdit : undefined}
        canWrite={canWrite}
      />
      {config.fields && (
        <ResourceForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
          fields={config.fields}
          initial={editing}
          saving={saving}
          title={editing ? `Edit ${config.singular}` : `New ${config.singular}`}
        />
      )}
    </>
  );
}
