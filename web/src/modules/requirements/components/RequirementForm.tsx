'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  ArrowRight,
  Edit,
  Calendar
} from 'lucide-react';
import useAuthStore from '@/modules/auth/store/authStore';
import useRequirementsStore from '@/modules/requirements/store/requirementsStore';
import { 
  Requirement, 
  RequirementFormData, 
  RequirementItemFormData,
  CriticalityLevel,
  PaymentMethod
} from '../types';

interface RequirementFormProps {
  initialData: RequirementFormData | null;
  isEditing?: boolean;
  isDuplicate?: boolean;
  onSubmit: (data: RequirementFormData) => void;
  loading?: boolean;
}

export default function RequirementForm({ 
  initialData, 
  isEditing = false,
  isDuplicate = false,
  onSubmit,
  loading: isLoading = false
}: RequirementFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createRequirement, updateRequirement, loading, error } = useRequirementsStore();

  // Form data state
  const [formData, setFormData] = useState<RequirementFormData>({
    title: '',
    costCenter: '',
    criticality: 'medium' as CriticalityLevel,
    paymentMethod: 'transfer' as PaymentMethod,
    paymentTerm: '30 días',
    warranty: false,
    additionalConditions: [],
    items: []
  });

  // Initialize form data from initial data if available
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        costCenter: initialData.costCenter,
        criticality: initialData.criticality,
        paymentMethod: initialData.paymentMethod,
        paymentTerm: initialData.paymentTerm,
        warranty: initialData.warranty,
        additionalConditions: initialData.additionalConditions || [],
        items: initialData.items.map(item => ({
          name: item.name,
          description: item.description,
          specificDescription: item.specificDescription,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          deliveryDate: item.deliveryDate,
          criticality: item.criticality,
          costCenter: item.costCenter,
          estimatedPrice: item.estimatedPrice
        }))
      });
    }
  }, [initialData]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle item field changes
  const handleItemChange = (index: number, field: keyof RequirementItemFormData, value: any) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      
      // Update total price if quantity or price changes
      if (field === 'quantity' || field === 'estimatedPrice') {
        const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
        const price = field === 'estimatedPrice' ? value : updatedItems[index].estimatedPrice;
        
        if (quantity && price) {
          updatedItems[index].estimatedPrice = quantity * price;
        }
      }
      
      return { ...prev, items: updatedItems };
    });
  };

  // Add a new item
  const addItem = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: '',
          description: '',
          specificDescription: '',
          quantity: 1,
          unitOfMeasure: 'Unidades',
          deliveryDate: tomorrow,
          criticality: prev.criticality,
          costCenter: prev.costCenter,
          estimatedPrice: 0
        }
      ]
    }));
  };

  // Remove an item
  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Add a new additional condition
  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      additionalConditions: [...(prev.additionalConditions || []), '']
    }));
  };

  // Update an additional condition
  const updateCondition = (index: number, value: string) => {
    setFormData(prev => {
      const updatedConditions = [...(prev.additionalConditions || [])];
      updatedConditions[index] = value;
      return { ...prev, additionalConditions: updatedConditions };
    });
  };

  // Remove an additional condition
  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalConditions: (prev.additionalConditions || []).filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      return;
    }
    
    try {
      // Call the onSubmit prop with the form data
      onSubmit(formData);
    } catch (err) {
      console.error('Error saving requirement:', err);
    }
  };

  // Format date for input fields
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}
      
      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-xl font-bold text-primary mb-4">FORMULARIO DE REQUERIMIENTO</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-secondary-foreground mb-1">TÍTULO DE UNA LÍNEA</label>
            <p className="text-sm text-muted-foreground mb-2">Con esta descripción se realizará el seguimiento al requerimiento y cotización</p>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2 border border-primary bg-secondary text-secondary-foreground rounded"
              placeholder="MATERIALES - PARTIDA #0002 - SJL"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-secondary-foreground mb-1">CONDICIONES GENERALES</label>
              <div className="space-y-2">
                <div>
                  <label className="block text-secondary-foreground">FORMA DE PAGO</label>
                  <div className="flex">
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="flex-1 p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                    >
                      <option value="transfer">Transferencia</option>
                      <option value="credit_card">Tarjeta de Crédito</option>
                      <option value="cash">Efectivo</option>
                      <option value="check">Cheque</option>
                    </select>
                    <button 
                      type="button"
                      className="ml-2 p-2 text-muted-foreground hover:text-primary"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-secondary-foreground">PLAZO DE PAGO</label>
                  <div className="flex">
                    <input
                      type="text"
                      name="paymentTerm"
                      value={formData.paymentTerm}
                      onChange={handleChange}
                      className="flex-1 p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                      placeholder="30 días"
                    />
                    <button 
                      type="button"
                      className="ml-2 p-2 text-muted-foreground hover:text-primary"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-secondary-foreground">GARANTÍA REQUERIDA</label>
                  <div className="flex">
                    <select
                      name="warranty"
                      value={formData.warranty ? "Sí" : "No"}
                      onChange={(e) => setFormData(prev => ({ ...prev, warranty: e.target.value === "Sí" }))}
                      className="flex-1 p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                    >
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                    <button 
                      type="button"
                      className="ml-2 p-2 text-muted-foreground hover:text-primary"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={addCondition}
                  className="flex items-center text-primary hover:text-amber-400"
                >
                  <Plus size={18} className="mr-1" />
                  <span>Agregar</span>
                </button>
                
                {formData.additionalConditions?.map((condition, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      value={condition}
                      onChange={(e) => updateCondition(index, e.target.value)}
                      className="flex-1 p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                      placeholder="Condición adicional"
                    />
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="ml-2 p-2 text-red-500 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-secondary p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">ÍTEMS DEL REQUERIMIENTO</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-amber-400 transition-colors"
          >
            <Plus size={18} className="mr-1" />
            <span>Agregar ítem</span>
          </button>
        </div>
        
        <div className="space-y-6">
          {formData.items.map((item, index) => (
            <div key={index} className="border border-border p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-secondary-foreground">Ítem #{index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-600"
                  title="Eliminar ítem"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-secondary-foreground mb-1">Nombre del ítem</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    required
                    className="w-full p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                    placeholder="Tubo PVC 4''"
                  />
                </div>
                
                <div>
                  <label className="block text-secondary-foreground mb-1">Descripción específica</label>
                  <input
                    type="text"
                    value={item.specificDescription || ''}
                    onChange={(e) => handleItemChange(index, 'specificDescription', e.target.value)}
                    className="w-full p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                    placeholder="PVC presión, 4', 6 m, clase 10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-secondary-foreground mb-1">Fecha de Entrega</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formatDateForInput(item.deliveryDate)}
                      onChange={(e) => handleItemChange(index, 'deliveryDate', new Date(e.target.value))}
                      required
                      className="w-full p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                    />
                    <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-secondary-foreground mb-1">Criticidad</label>
                  <select
                    value={item.criticality}
                    onChange={(e) => handleItemChange(index, 'criticality', e.target.value as CriticalityLevel)}
                    className="w-full p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-secondary-foreground mb-1">Centro de Costo</label>
                  <input
                    type="text"
                    value={item.costCenter}
                    onChange={(e) => handleItemChange(index, 'costCenter', e.target.value)}
                    required
                    className="w-full p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                    placeholder="Obra San Juan Lurigancho"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-secondary-foreground mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                    min="1"
                    required
                    className="w-full p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-secondary-foreground mb-1">Unidad de medida</label>
                  <input
                    type="text"
                    value={item.unitOfMeasure}
                    onChange={(e) => handleItemChange(index, 'unitOfMeasure', e.target.value)}
                    required
                    className="w-full p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                    placeholder="Metros lineales"
                  />
                </div>
                
                <div>
                  <label className="block text-secondary-foreground mb-1">Precio estimado unitario (S/)</label>
                  <input
                    type="number"
                    value={item.estimatedPrice || ''}
                    onChange={(e) => handleItemChange(index, 'estimatedPrice', parseFloat(e.target.value))}
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-primary bg-secondary text-secondary-foreground rounded"
                  />
                </div>
              </div>
            </div>
          ))}
          
          {formData.items.length === 0 && (
            <div className="text-center p-8 border border-dashed border-muted-foreground rounded-lg">
              <p className="text-muted-foreground">No hay ítems agregados. Haz clic en "Agregar ítem" para comenzar.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => router.push('/dashboard/requirements')}
          className="flex items-center px-6 py-2 border border-primary text-primary rounded-md hover:bg-primary/10"
        >
          <ArrowLeft size={18} className="mr-2" />
          Retroceder sin Guardar
        </button>
        
        <div className="space-x-4">
          <button
            type="button"
            className="px-6 py-2 bg-secondary text-secondary-foreground border border-primary rounded-md hover:bg-secondary/80"
          >
            Guardar borrador
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-amber-400"
          >
            {isLoading ? 'Enviando...' : (
              <>
                <span>Enviar a aprobación</span>
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
