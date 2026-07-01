import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileImage, LayoutTemplate } from 'lucide-react';
import { Templates } from './Templates';
import { Materials } from './Materials';

type ResourceTab = 'templates' | 'materials';

const tabs: Array<{
  id: ResourceTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  {
    id: 'materials',
    label: '素材库',
    description: '产品图、项目现场、品牌图标、图表素材',
    icon: FileImage,
  },
  {
    id: 'templates',
    label: '模板库',
    description: '封面版式、汇报风格、常用页面模板',
    icon: LayoutTemplate,
  },
];

export const Resources: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'templates' ? 'templates' : 'materials';

  const switchTab = (tab: ResourceTab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-gray-200 bg-white p-3">
        <div className="grid gap-2 md:grid-cols-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={[
                  'flex items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors',
                  active
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                <Icon size={18} className={active ? 'mt-0.5 text-amber-700' : 'mt-0.5 text-gray-500'} />
                <span>
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className="mt-1 block text-xs leading-5 opacity-80">{tab.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {currentTab === 'materials' ? <Materials /> : <Templates />}
    </div>
  );
};
