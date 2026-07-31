import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCard, getCard, updateCard } from '@/api/cards';
import type { Card } from '@/types/card';
import CardForm from '@/components/cards/CardForm';
import Spinner from '@/components/ui/Spinner';
import { showApiError } from '@/utils/errorHandler';
import { vibrateSuccess, vibrateError } from '@/utils/haptics';
import toast from 'react-hot-toast';

const CreateCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [initialData, setInitialData] = useState<Card | undefined>(undefined);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchCard = async () => {
        try {
          const card = await getCard(id);
          setInitialData(card);
        } catch (err) {
          showApiError(err, 'Failed to load card.');
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      };
      fetchCard();
    }
  }, [id, navigate]);

  const handleSubmit = async (data: Partial<Card>) => {
    setSaving(true);
    try {
      if (isEditing && id) {
        await updateCard(id, data);
        vibrateSuccess();
        toast.success('Card updated!');
      } else {
        await createCard(data);
        vibrateSuccess();
        toast.success('Card created!');
      }
      if (isEditing && id) {
        navigate('/my-cards');
      } else {
        navigate('/my-cards');
      }
    } catch (err: any) {
      showApiError(err, 'Failed to save card.');
      vibrateError();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <h1 className="mb-8 font-display text-3xl font-extrabold tracking-tight text-gradient-gold">
        {isEditing ? 'Edit Card' : 'Create New Card'}
      </h1>
      <CardForm initialData={initialData} onSubmit={handleSubmit} loading={saving} />
    </div>
  );
};

export default CreateCardPage;
