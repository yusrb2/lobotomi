import { TabPanel, Tabs } from '../../components/ui/Tabs';
import { dict, planSubTab, type PlanSubTab } from '../../state/store';
import { IfThenRules } from './IfThenRules';
import { LowDopamineMenu } from './LowDopamineMenu';

export function PlanView() {
  const copy = dict.value;

  return (
    <section className="py-2">
      <Tabs
        value={planSubTab.value}
        onValueChange={(v) => {
          planSubTab.value = v as PlanSubTab;
        }}
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
