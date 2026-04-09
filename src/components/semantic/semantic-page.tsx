import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ModelsTab } from "./models-tab";
import { JoinsTab } from "./joins-tab";
import { MacrosTab } from "./macros-tab";

export function SemanticPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Tools</h1>
        <p className="text-muted-foreground">
          Define reusable views, joins, and SQL macros on top of your data sources
        </p>
      </div>

      <Tabs defaultValue="models">
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="joins">Joins</TabsTrigger>
          <TabsTrigger value="macros">Macros</TabsTrigger>
        </TabsList>
        <TabsContent value="models" className="mt-4">
          <ModelsTab />
        </TabsContent>
        <TabsContent value="joins" className="mt-4">
          <JoinsTab />
        </TabsContent>
        <TabsContent value="macros" className="mt-4">
          <MacrosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
