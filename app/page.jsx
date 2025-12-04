import dynamic from 'next/dynamic';
const CustomizerDemo = dynamic(()=>import('../../components/CustomizerDemo'), {ssr:false});

export default function CustomizePage(){
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <CustomizerDemo />
      </div>
    </div>
  );
}
