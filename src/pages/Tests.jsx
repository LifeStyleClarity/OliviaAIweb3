import { useState } from 'react'
import { Button } from '@heroui/react'
import { Card, CardBody, CardHeader } from '@heroui/react'
import ChatMigrationTest from '../components/ui/ChatMigrationTest'
import ICPTestPage from '../components/ICPTestPage'
import PrivacyFilterTest from '../components/PrivacyFilterTest'
import TradingTest from '../components/TradingTest'

export default function Tests() {
  const [activeTest, setActiveTest] = useState('migration')

  const tests = [
    {
      id: 'migration',
      title: 'Olivia AI Migration Test',
      description: 'Test the migration from old to new Olivia AI system',
      component: <ChatMigrationTest />
    },
    {
      id: 'icp-integration',
      title: 'ICP Integration Test',
      description: 'Test the ICP canister integration and debug connection issues',
      component: <ICPTestPage />
    },
    {
      id: 'privacy-filter',
      title: 'Privacy Filter Test',
      description: 'Test the AI privacy detection and message hashing system',
      component: <PrivacyFilterTest />
    },
    {
      id: 'trading-integration',
      title: 'OKX DEX Trading Test',
      description: 'Test Olivia AI trading integration with OKX DEX API',
      component: <TradingTest />
    }
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Test Suite</h1>
        <p className="text-gray-600">
          Test various components and features of the OliviaAI application
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Test Navigation */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Available Tests</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {tests.map((test) => (
                  <Button
                    key={test.id}
                    variant={activeTest === test.id ? "solid" : "bordered"}
                    className={`w-full justify-start ${
                      activeTest === test.id ? 'bg-blue-500 text-white' : ''
                    }`}
                    onPress={() => setActiveTest(test.id)}
                  >
                    {test.title}
                  </Button>
                ))}
        </div>
            </CardBody>
          </Card>
        </div>

        {/* Test Content */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
        <div>
                <h3 className="text-lg font-semibold">
                  {tests.find(t => t.id === activeTest)?.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {tests.find(t => t.id === activeTest)?.description}
                </p>
        </div>
            </CardHeader>
            <CardBody>
              {tests.find(t => t.id === activeTest)?.component}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
