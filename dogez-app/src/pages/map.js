import dynamic from 'next/dynamic';

const DynamicLeafletMap = dynamic(
  () => import('../components/Map'), // replace this with the path to your LeafletMap component
  { ssr: false } // This will load the component only on client side
);

export default function MapPage() {
  return (
    <div>
      <DynamicLeafletMap />
    </div>
  );
}
