import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { timeToMinutes, addMinutes } from '../lib/time';

const WorkflowContext = createContext(null);

const INITIAL_ITEMS = [
  { id: 1, time: '14:00', title: 'Clase de violín', type: 'Clase', people: 'Maestra Laura · 3 alumnos', location: 'Sala 2' },
  { id: 2, time: '15:30', title: 'Comida del equipo', type: 'Logística', people: 'Maestros invitados', location: 'Comedor' },
  { id: 3, time: '17:00', title: 'Ensayo con orquesta', type: 'Ensayo', people: 'Orquesta juvenil', location: 'Auditorio' },
  { id: 4, time: '18:30', title: 'Transporte a hotel', type: 'Transporte', people: 'Maestros extranjeros', location: 'Lobby' },
];

export function WorkflowProvider({ children }) {
  const [items, setItems] = useState(INITIAL_ITEMS);

  useEffect(() => {
    api.get('/workflow')
      .then((res) => { if (res.data?.length) setItems(res.data); })
      .catch(() => {});
  }, []);

  const ordered = useMemo(
    () => [...items].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)),
    [items]
  );

  const update = (id, changes) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
    api.put(`/workflow/${id}`, changes).catch(() => toast.error('No se pudo guardar el cambio'));
  };

  const shift = (id, minutes) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const newTime = addMinutes(item.time, minutes);
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, time: newTime } : it)));
    api.put(`/workflow/${id}`, { time: newTime }).catch(() => {});
  };

  const add = async (fields) => {
    const tempId = Date.now(); // optimistic
    setItems((prev) => [...prev, { ...fields, id: tempId }]);
    try {
      const { data } = await api.post('/workflow', fields);
      // Reemplaza el ID temporal con el ID real de Supabase
      setItems((prev) => prev.map((it) => (it.id === tempId ? data : it)));
    } catch {
      setItems((prev) => prev.filter((it) => it.id !== tempId));
      toast.error('No se pudo crear la actividad');
    }
  };

  const remove = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    api.delete(`/workflow/${id}`).catch(() => toast.error('No se pudo eliminar'));
  };

  return (
    <WorkflowContext.Provider value={{ items, ordered, update, shift, add, remove }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export const useWorkflow = () => useContext(WorkflowContext);
