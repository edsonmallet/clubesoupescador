// Mock-only: não existe conceito de "loja parceira" em packages/shared-types
// nem no admin ainda (sem branding/categoria/rating de tenant). Tipos e dados
// abaixo são só pra essa tela — TODO: substituir por contrato real quando
// existir um módulo de lojistas/tenants com esses campos.
export type Store = {
  id: string
  name: string
  logoUrl: string
  category: string
  city: string
  state: string
  rating: number
  description: string
  phone: string
  address: string
  memberSince: string
}

const MOCK_STORES: Store[] = [
  {
    id: 'store-1',
    name: 'Casa do Pescador',
    logoUrl: '/stores/store-1.png',
    category: 'Loja de Pesca',
    city: 'Salvador',
    state: 'BA',
    rating: 4.8,
    description:
      'Tudo pra sua pescaria: varas, carretilhas, iscas e acessórios das melhores marcas.',
    phone: '(71) 3333-4444',
    address: 'Av. Oceânica, 1200 — Salvador/BA',
    memberSince: '2023-02-10T12:00:00.000Z',
  },
  {
    id: 'store-2',
    name: 'Point da Pesca',
    logoUrl: '/stores/store-2.png',
    category: 'Loja de Pesca',
    city: 'Ilhéus',
    state: 'BA',
    rating: 4.5,
    description:
      'Especializada em pesca esportiva e embarcada, com equipe própria de guias.',
    phone: '(73) 3222-1111',
    address: 'Rua da Marina, 45 — Ilhéus/BA',
    memberSince: '2023-05-22T12:00:00.000Z',
  },
  {
    id: 'store-3',
    name: 'Anzol & Cia',
    logoUrl: '/stores/store-3.png',
    category: 'Iscas e Anzóis',
    city: 'Porto Seguro',
    state: 'BA',
    rating: 4.2,
    description: 'Maior variedade de anzóis, chumbadas e linhas da região.',
    phone: '(73) 3288-5566',
    address: 'Av. dos Navegantes, 300 — Porto Seguro/BA',
    memberSince: '2023-08-14T12:00:00.000Z',
  },
  {
    id: 'store-4',
    name: 'Pescaria Show',
    logoUrl: '/stores/store-4.png',
    category: 'Loja de Pesca',
    city: 'Salvador',
    state: 'BA',
    rating: 4.9,
    description:
      'Referência em equipamentos importados pra pesca esportiva de alto nível.',
    phone: '(71) 3344-2200',
    address: 'Shopping Barra, Loja 22 — Salvador/BA',
    memberSince: '2022-11-03T12:00:00.000Z',
  },
  {
    id: 'store-5',
    name: 'Náutica Bahia',
    logoUrl: '/stores/store-5.png',
    category: 'Náutica',
    city: 'Camaçari',
    state: 'BA',
    rating: 4.0,
    description: 'Barcos, coletes salva-vidas e acessórios náuticos em geral.',
    phone: '(71) 3622-8899',
    address: 'Rod. do Coco, km 12 — Camaçari/BA',
    memberSince: '2024-01-18T12:00:00.000Z',
  },
  {
    id: 'store-6',
    name: 'Iscas & Cia',
    logoUrl: '/stores/store-6.png',
    category: 'Iscas Vivas',
    city: 'Vera Cruz',
    state: 'BA',
    rating: 4.6,
    description: 'Iscas vivas e artificiais fresquinhas, direto pro seu barco.',
    phone: '(75) 3288-1122',
    address: 'Beira Mar, s/n — Vera Cruz/BA',
    memberSince: '2024-03-09T12:00:00.000Z',
  },
  {
    id: 'store-7',
    name: 'Camping & Pesca',
    logoUrl: '/stores/store-7.png',
    category: 'Camping',
    city: 'Lençóis',
    state: 'BA',
    rating: 4.3,
    description:
      'Estrutura completa pra quem une pesca e camping nas trilhas da Chapada.',
    phone: '(75) 3334-7788',
    address: 'Rua das Pedras, 88 — Lençóis/BA',
    memberSince: '2023-10-27T12:00:00.000Z',
  },
]

const delay = <T>(value: T) => Promise.resolve(value)

export const storesService = {
  list: () => delay<Store[]>(MOCK_STORES),
  getById: (id: string) =>
    delay<Store>(
      MOCK_STORES.find((store) => store.id === id) ?? MOCK_STORES[0],
    ),
}
