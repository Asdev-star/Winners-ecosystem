interface Props {
  title: string;
  value: string;
  change?: string;
}

export default function StatCard({ title, value, change }: Props) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h4 className="text-sm text-gray-500 mb-2">{title}</h4>
      <div className="text-2xl font-semibold">{value}</div>
      {change && (
        <div className="text-sm text-green-600 mt-1">
          {change}
        </div>
      )}
    </div>
  );
}
