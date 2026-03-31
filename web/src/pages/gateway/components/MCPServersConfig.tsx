import { Input, Select, SelectItem, Button, Accordion, AccordionItem } from "@heroui/react";
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LocalIcon from '@/components/LocalIcon';
import type { Gateway, MCPServerConfig } from '@/types/gateway';

interface MCPServersConfigProps {
  parsedConfig: Gateway;
  updateConfig: (newData: Partial<Gateway>) => void;
}

export function MCPServersConfig({
  parsedConfig,
  updateConfig
}: MCPServersConfigProps) {
  const { t } = useTranslation();
  const mcpServers = useMemo(() => 
    parsedConfig?.mcpServers || [{
      type: "sse",
      name: "",
      url: "",
      policy: "onDemand"
    }],
    [parsedConfig?.mcpServers]
  );

  const updateServer = (index: number, field: 'name' | 'type' | 'policy' | 'url', value: string) => {
    const updatedServers = [...mcpServers];
    const oldName = updatedServers[index].name;
    
    updatedServers[index] = {
      ...updatedServers[index],
      [field]: value
    };

    // If server name changed, update router references
    if (field === 'name' && oldName !== value && parsedConfig.routers) {
      const updatedRouters = parsedConfig.routers.map(router => {
        if (router.server === oldName) {
          return { ...router, server: value };
        }
        return router;
      });
      updateConfig({ mcpServers: updatedServers, routers: updatedRouters });
    } else {
      updateConfig({ mcpServers: updatedServers });
    }
  };

  const addServer = () => {
    const newServer: MCPServerConfig = {
      type: "sse",
      name: "",
      url: "",
      policy: "onDemand"
    };
    updateConfig({
      mcpServers: [...mcpServers, newServer]
    });
  };

  const removeServer = (index: number) => {
    const updatedServers = mcpServers.filter((_, i) => i !== index);
    updateConfig({
      mcpServers: updatedServers
    });
  };

  return (
    <div className="space-y-4">
      <Accordion variant="splitted">
        {mcpServers.map((server, index) => (
          <AccordionItem 
            key={index} 
            title={server.name || `MCP Server ${index + 1}`}
            subtitle={server.type}
            startContent={
              <LocalIcon icon={
                  server.type === 'sse' ? 'lucide:radio' : 'lucide:globe'
                } 
                className="text-primary-500" 
              />
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('gateway.server_name')}
                  value={server.name || ""}
                  onChange={(e) => updateServer(index, 'name', e.target.value)}
                  maxLength={50}
                  description={t('gateway.server_name_limit', { count: server.name?.length || 0, max: 50 })}
                />
                <Select
                  label={t('gateway.mcp_type')}
                  selectedKeys={[server.type || "sse"]}
                  onChange={(e) => updateServer(index, 'type', e.target.value)}
                  aria-label={t('gateway.mcp_type')}
                >
                  <SelectItem key="sse" textValue="sse">sse</SelectItem>
                  <SelectItem key="streamable-http" textValue="streamable-http">streamable-http</SelectItem>
                </Select>
              </div>

              <Select
                label={t('gateway.startup_policy')}
                selectedKeys={[server.policy || "onDemand"]}
                onChange={(e) => updateServer(index, 'policy', e.target.value)}
                aria-label={t('gateway.startup_policy')}
              >
                <SelectItem key="onDemand" textValue={t('gateway.policy_on_demand')}>{t('gateway.policy_on_demand')}</SelectItem>
                <SelectItem key="onStart" textValue={t('gateway.policy_on_start')}>{t('gateway.policy_on_start')}</SelectItem>
              </Select>

              {(server.type === 'sse' || server.type === 'streamable-http') && (
                <div className="bg-content1 p-4 rounded-medium border border-content2">
                  <Input
                    label={t('gateway.url')}
                    value={server.url || ''}
                    onChange={(e) => updateServer(index, 'url', e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  color="danger" 
                  variant="flat" 
                  size="sm"
                  startContent={<LocalIcon icon="lucide:trash-2" />}
                  onPress={() => removeServer(index)}
                >
                  {t('gateway.remove_server')}
                </Button>
              </div>
            </div>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-center">
        <Button
          color="primary"
          variant="flat"
          startContent={<LocalIcon icon="lucide:plus" />}
          onPress={addServer}
        >
          {t('gateway.add_mcp_server')}
        </Button>
      </div>
    </div>
  );
}
