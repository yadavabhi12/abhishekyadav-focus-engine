import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ProductivityChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="productiveHours" 
          stroke="#3B82F6" 
          name="Productive Hours"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="completionRate" 
          stroke="#10B981" 
          name="Completion Rate %"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default ProductivityChart