import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import InsightCard from '@/components/insights/InsightCard';
import InsightFilter from '@/components/insights/InsightFilter';
import { getInsights, generateInsights, dismissInsight } from '@/api/insights';
import type { Insight } from '@/types/insight';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const InsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeType, setActiveType] = useState<string | undefined>(undefined);

  const fetchInsights = useCallback(async (type?: string) => {
    setLoading(true);
    try {
      const data = await getInsights(type);
      setInsights(data);
    } catch (err: any) {
      showApiError(err, 'Failed to load insights.');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights(activeType);
  }, [fetchInsights, activeType]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await generateInsights();
      setInsights(data);
      toast.success('New insights generated!');
    } catch (err: any) {
      showApiError(err, 'Failed to generate insights.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissInsight(id);
      setInsights((prev) => prev.filter((i) => i.id !== id));
      toast.success('Insight dismissed.');
    } catch (err) {
      showApiError(err, 'Failed to dismiss insight.');
    }
  };

  const handleAction = (insight: Insight) => {
    // Each insight type could navigate or trigger an action
    // For now, we just log or could navigate based on data
    toast.success(`Action triggered: ${insight.title}`);
  };

  const handleFilterChange = (type?: string) => {
    setActiveType(type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-gold">AI Insights</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Smart suggestions to help you network better.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          loading={generating}
          onClick={handleGenerate}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Generate
        </Button>
      </div>

      {/* Filter */}
      <InsightFilter activeType={activeType} onSelect={handleFilterChange} />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && insights.length === 0 && (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title="No insights yet"
          description="Generate AI insights to get personalized networking suggestions, follow-up reminders, and more."
          action={{
            label: 'Generate Insights',
            onClick: handleGenerate,
          }}
        />
      )}

      {/* Insights grid */}
      {!loading && insights.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={handleDismiss}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
