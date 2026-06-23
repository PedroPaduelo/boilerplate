/**
 * Dialog de DETALHES de um bloco do catálogo. Mostra a "ficha técnica" que o
 * MCP entrega à IA: descrição, origem, props visuais configuráveis
 * (`propsSchema`), contrato de dados (`dataContract`: shape + spec + exemplo) e
 * `defaultProps`. Read-only — documentação navegável do componente.
 */
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { KIND_LABEL, SHAPE_LABEL, type CatalogEntry } from '../lib/catalog-entries';

interface BlockDetailDialogProps {
  entry: CatalogEntry | null;
  onOpenChange: (open: boolean) => void;
}

interface PropSchema {
  type?: string | string[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
}
interface PropsSchemaLike {
  properties?: Record<string, PropSchema>;
  required?: string[];
}

function propTypeLabel(schema: PropSchema): string {
  if (schema.enum?.length) return schema.enum.map((v) => String(v)).join(' · ');
  if (Array.isArray(schema.type)) return schema.type.join(' | ');
  return schema.type ?? 'any';
}

function CodeBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-lg border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h4>
  );
}

export function BlockDetailDialog({ entry, onOpenChange }: BlockDetailDialogProps) {
  const manifest = entry?.definition.manifest;
  const propsSchema = manifest?.propsSchema as PropsSchemaLike | undefined;
  const properties = propsSchema?.properties ?? {};
  const required = new Set(propsSchema?.required ?? []);
  const propEntries = Object.entries(properties);
  const dataContract = manifest?.dataContract;

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {entry && manifest ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>{manifest.name}</DialogTitle>
                <Badge variant="secondary">{KIND_LABEL[entry.kind]}</Badge>
                {entry.shape ? (
                  <Badge variant="outline">{SHAPE_LABEL[entry.shape]}</Badge>
                ) : null}
              </div>
              <DialogDescription>{manifest.description}</DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Meta label="Tipo" value={<code className="text-xs">{manifest.type}</code>} />
              <Meta label="Origem" value={<code className="text-xs">{manifest.source}</code>} />
              <Meta label="Versão" value={manifest.version ?? '—'} />
            </dl>

            <Separator />

            <section className="space-y-2">
              <SectionLabel>
                Propriedades visuais {propEntries.length ? `(${propEntries.length})` : ''}
              </SectionLabel>
              {propEntries.length ? (
                <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
                  {propEntries.map(([key, schema]) => (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-medium text-foreground">{key}</code>
                        {required.has(key) ? (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                            obrigatório
                          </Badge>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {propTypeLabel(schema)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sem props configuráveis.</p>
              )}
            </section>

            <section className="space-y-2">
              <SectionLabel>Contrato de dados</SectionLabel>
              {dataContract ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Shape <code className="text-xs text-foreground">{dataContract.shape}</code> — a
                    query do agente precisa produzir este formato.
                  </p>
                  <CodeBlock value={dataContract.example ?? dataContract.spec} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Bloco narrativo — não consome dados (o conteúdo vem das props).
                </p>
              )}
            </section>

            {manifest.defaultProps &&
            Object.keys(manifest.defaultProps as object).length > 0 ? (
              <section className="space-y-2">
                <SectionLabel>Props padrão</SectionLabel>
                <CodeBlock value={manifest.defaultProps} />
              </section>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
