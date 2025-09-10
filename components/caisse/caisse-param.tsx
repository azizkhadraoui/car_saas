"use client"

import { useState } from "react"

// Simple icon components
const Tags = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const Plus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const X = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const TrendingUp = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const CreditCard = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const Wrench = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
  </svg>
)

const Droplets = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 14.25c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z M12 2.5l6.5 6.5c1.657 1.657 1.657 4.343 0 6s-4.343 1.657-6 0L12 14.5 11.5 15c-1.657 1.657-4.343 1.657-6 0s-1.657-4.343 0-6L12 2.5z" />
  </svg>
)

const Database = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
)

// Named export for use in other components
export function CaisseParam({ selectedMonth, selectedYear, tabConfig }) {
  const [keywordSettings, setKeywordSettings] = useState({
    beneficeMO: {
      keywords: [
        "main d'oeuvre",
        "réparation",
        "diagnostic",
        "vidange",
        "révision",
        "entretien",
        "montage",
        "démontage",
      ],
      newKeyword: "",
    },
    charge: {
      keywords: [
        "loyer",
        "électricité",
        "eau",
        "téléphone",
        "assurance",
        "carburant",
        "fourniture bureau",
        "frais bancaire",
      ],
      newKeyword: "",
    },
    achatPiece: {
      keywords: [
        "pièce",
        "filtre",
        "huile moteur",
        "plaquette",
        "disque",
        "amortisseur",
        "courroie",
        "bougie",
        "batterie",
      ],
      newKeyword: "",
    },
    huile: {
      keywords: ["huile", "lubrifiant", "5w30", "5w40", "10w40", "synthétique", "semi-synthétique", "minérale"],
      newKeyword: "",
    },
  })

  const caisseTypes = [
    {
      key: "beneficeMO",
      label: "Bénéfice Main d'Œuvre",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Mots-clés pour identifier les services de main d'œuvre et réparations",
    },
    {
      key: "charge",
      label: "Charges",
      icon: CreditCard,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Mots-clés pour identifier les dépenses et charges d'exploitation",
    },
    {
      key: "achatPiece",
      label: "Achat Pièces",
      icon: Wrench,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Mots-clés pour identifier les achats de pièces détachées",
    },
    {
      key: "huile",
      label: "Huile",
      icon: Droplets,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Mots-clés pour identifier les produits d'huile et lubrifiants",
    },
  ]

  const addKeyword = (caisseType) => {
    const newKeyword = keywordSettings[caisseType].newKeyword.trim().toLowerCase()
    if (newKeyword && !keywordSettings[caisseType].keywords.includes(newKeyword)) {
      setKeywordSettings((prev) => ({
        ...prev,
        [caisseType]: {
          ...prev[caisseType],
          keywords: [...prev[caisseType].keywords, newKeyword],
          newKeyword: "",
        },
      }))
    }
  }

  const removeKeyword = (caisseType, keyword) => {
    setKeywordSettings((prev) => ({
      ...prev,
      [caisseType]: {
        ...prev[caisseType],
        keywords: prev[caisseType].keywords.filter((k) => k !== keyword),
      },
    }))
  }

  const updateNewKeyword = (caisseType, value) => {
    setKeywordSettings((prev) => ({
      ...prev,
      [caisseType]: {
        ...prev[caisseType],
        newKeyword: value,
      },
    }))
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className={`bg-white rounded-lg border-2 shadow-sm ${tabConfig?.borderColor || 'border-blue-200'}`}>
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tags className={`h-6 w-6 ${tabConfig?.color || 'text-blue-600'}`} />
            Catégorisation Automatique des Factures
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Définissez des mots-clés pour catégoriser automatiquement les éléments de factures dans les bonnes caisses.
            Le système analysera la description des articles pour les affecter automatiquement.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {caisseTypes.map((caisse) => {
              const Icon = caisse.icon
              const caisseData = keywordSettings[caisse.key]

              return (
                <div key={caisse.key} className="bg-white rounded-lg border shadow-sm">
                  <div className={`px-4 py-3 ${caisse.bgColor} border-b rounded-t-lg`}>
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Icon className={`h-5 w-5 ${caisse.color}`} />
                      {caisse.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{caisse.description}</p>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Mots-clés actuels:</label>
                      <div className="flex flex-wrap gap-2">
                        {caisseData.keywords.map((keyword, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-md border">
                            {keyword}
                            <button
                              className="ml-1 p-0.5 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                              onClick={() => removeKeyword(caisse.key, keyword)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nouveau mot-clé..."
                          value={caisseData.newKeyword}
                          onChange={(e) => updateNewKeyword(caisse.key, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addKeyword(caisse.key)
                            }
                          }}
                          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => addKeyword(caisse.key)}
                          disabled={!caisseData.newKeyword.trim()}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Comment ça fonctionne
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Le système analyse automatiquement la description de chaque article de facture</li>
              <li>• Si un mot-clé correspond, l'article est affecté à la caisse correspondante</li>
              <li>• Les articles non catégorisés apparaîtront dans la caisse TVA pour traitement manuel</li>
              <li>• Vous pouvez ajouter ou supprimer des mots-clés à tout moment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Default export for standalone use
export default function KeywordsManager() {
  return <CaisseParam selectedMonth="" selectedYear="" tabConfig={null} />
}