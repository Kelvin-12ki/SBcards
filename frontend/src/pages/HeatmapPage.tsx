import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, RefreshCw } from 'lucide-react';
import HeatmapGrid from '@/components/heatmap/HeatmapGrid';
import PeakTimesList from '@/components/heatmap/PeakTimesList';
import LocationDensityChart from '@/components/heatmap/LocationDensityChart';
import { getHeatmap, getPeakTimes, getLocationDensity, generateHeatmap } from '@/api/heatmap';
import { getEvent } from '@/api/events';
import type { HeatmapData, PeakTime, LocationDensity } from '@/types/heatmap';
import type { Event } from '@/types/event';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const HeatmapPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [peakTimes, setPeakTimes] = useState<PeakTime[]>([]);
  const [locationDensity, setLocationDensity] = useState<LocationDensity[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [eventData, heatmap, peaks, locations] = await Promise.all([
        getEvent(eventId),
        getHeatmap(eventId).catch(() => []),
        getPeakTimes(eventId).catch(() => []),
        getLocationDensity(eventId).catch(() => []),
      ]);
      setEvent(eventData);
      setHeatmapData(heatmap);
      setPeakTimes(peaks);
      setLocationDensity(locations);
    } catch (err: any) {
      showApiError(err, 'Failed to load heatmap data.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (!eventId) return;
    setGenerating(true);
    try {
      await generateHeatmap(eventId);
      toast.success('Heatmap data generated!');
      await fetchData();
    } catch (err: any) {
      showApiError(err, 'Failed to generate heatmap.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <EmptyState
        icon={<Activity className="h-8 w-8" />}
        title="Event not found"
        description="Could not load event data for this heatmap."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">
              Event Heatmap
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">{event.name}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={generating}
            onClick={handleGenerate}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Generate
          </Button>
        </div>
      </div>

      {/* Heatmap grid */}
      <HeatmapGrid data={heatmapData} />

      {/* Peak times + Location density side by side */}
      <div className="grid gap-6 sm:grid-cols-2">
        <PeakTimesList peaks={peakTimes} />
        <LocationDensityChart locations={locationDensity} />
      </div>

      {/* Empty state when no data at all */}
      {heatmapData.length === 0 && peakTimes.length === 0 && locationDensity.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={<Activity className="h-8 w-8" />}
            title="No heatmap data"
            description="Heatmap data is not yet available for this event. Generate it to see activity patterns."
            action={{
              label: 'Generate Heatmap',
              onClick: handleGenerate,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HeatmapPage;
