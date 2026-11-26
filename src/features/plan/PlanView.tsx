import { useState } from 'preact/hooks';
import { TabPanel, Tabs } from '../../components/ui/Tabs';
import { dict } from '../../state/store';
import { IfThenRules } from './IfThenRules';
import { LowDopamineMenu } from './LowDopamineMenu';

export function PlanView() {
  const copy = dict.value;
  const [subTab, setSubTab] = useState('rules');

  return (
    <section className="py-2">
      <Tabs
        value={subTab}
        onValueChange={setSubTab}
        options={[
          { value: 'rules', label: copy.plan.tabs.rules },
          { value: 'menu', label: copy.plan.tabs.menu },
        ]}
      >
        <TabPanel value="rules">
          <IfThenRules />
        </TabPanel>
        <TabPanel value="menu">
          <LowDopamineMenu />
        </TabPanel>
      </Tabs>
    </section>
  );
}
