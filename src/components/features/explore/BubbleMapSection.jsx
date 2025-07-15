import { useState, useEffect } from 'react';
import { socialService } from '../../../api';
import BubbleMap from './BubbleMap';

export default function BubbleMapSection() {
  const [bubbleIsLoading, setBubbleIsLoading] = useState(true);
  const [bubbleData, setBubbleData] = useState([]);

  useEffect(() => {
    const fetchBubbleData = async () => {
      setBubbleIsLoading(true);
      try {
        const mentionsData = await socialService.getMentions();

        const transformedData = mentionsData.map((item) => ({
          name: item.cashtag,
          value: item.mentions,
        }));

        setBubbleData(transformedData);
      } catch (error) {
        console.error("Error fetching bubble data:", error);
        setBubbleData([]);
      } finally {
        setBubbleIsLoading(false);
      }
    };

    fetchBubbleData();
  }, []);

  return (
    <div className="w-full z-10 mt-10">
      <div className="flex items-center justify-center mb-4 z-10">
        <h2 className="text-[18px] font-medium">Explore New Market Opportunities</h2>
      </div>
      <div className="border-[#2D394A] border-2 border-solid rounded-2xl ">
        <BubbleMap data={bubbleData} bubbleIsLoading={bubbleIsLoading} />
      </div>
    </div>
  );
}
