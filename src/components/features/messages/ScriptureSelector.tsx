"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronLeft, Check, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ScriptureSelection {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface Translation {
  id: string;
  name: string;
  englishName?: string;
  language?: string;
}

interface Book {
  name: string;
  code: string;
  chapters: number;
}

interface Chapter {
  chapter: number;
  verses: number;
}

interface Verse {
  verse: number;
  text: string;
}

interface ScriptureSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVerses: (verses: ScriptureSelection[]) => void;
}

const API_BASE = "https://bible.helloao.org/api";

const ENDPOINTS = {
  translations: () => `${API_BASE}/available_translations.json`,
  books: (translationId: string) => `${API_BASE}/${translationId}/books.json`,
  chapter: (translationId: string, bookSlug: string, chapter: number) =>
    `${API_BASE}/${translationId}/${bookSlug}/${chapter}.json`,
};

async function fetchJSON<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  const text = await response.text();

  if (text.trim().startsWith("<!doctype") || text.trim().startsWith("<html")) {
    throw new Error(
      `The server returned an HTML page instead of JSON. This usually means the endpoint doesn't exist or the server is having issues.\nAttempted URL: ${url}\nResponse preview: ${text.slice(0, 200)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}. Server responded with: ${text.slice(0, 200)}`);
  }
}

const BibleAPI = {
  getAvailableTranslations: async (): Promise<Translation[]> => {
    const data = await fetchJSON<{ translations: Translation[] }>(ENDPOINTS.translations());
    return data.translations || [];
  },

  getBooks: async (translationId: string): Promise<Book[]> => {
    const data = await fetchJSON<{ books: Array<Record<string, unknown>> }>(ENDPOINTS.books(translationId));
    return (
      data.books?.map((b) => ({
        name: typeof b.name === "string" ? b.name : "Unknown Book",
        code: typeof b.id === "string" ? b.id : "",
        chapters:
          typeof b.numberOfChapters === "number"
            ? b.numberOfChapters
            : typeof b.lastChapterNumber === "number"
            ? b.lastChapterNumber
            : 0,
      })) || []
    );
  },

  getChapter: async (
    translationId: string,
    bookSlug: string,
    chapter: number
  ): Promise<{ verses: Verse[] }> => {
    const data = await fetchJSON<unknown>(ENDPOINTS.chapter(translationId, bookSlug, chapter));

    if (typeof data === "object" && data !== null) {
      const record = data as Record<string, unknown>;
      const chapterNode = record["chapter"] as Record<string, unknown> | undefined;
      const contentArray = Array.isArray(chapterNode?.["content"])
        ? (chapterNode["content"] as unknown[])
        : Array.isArray(record["content"])
        ? (record["content"] as unknown[])
        : undefined;

      const normalizeSegment = (segment: unknown) => {
        if (typeof segment === "string") return segment;
        if (typeof segment === "object" && segment !== null) {
          const segRecord = segment as Record<string, unknown>;
          if (typeof segRecord.text === "string") return segRecord.text;
          if (segRecord.lineBreak === true) return "\n";
        }
        return "";
      };

      const verses: Verse[] = [];

      if (Array.isArray(contentArray)) {
        let currentVerse: Verse | null = null;

        const flushVerse = () => {
          if (currentVerse) {
            currentVerse.text = currentVerse.text.trim();
            verses.push(currentVerse);
            currentVerse = null;
          }
        };

        for (const item of contentArray) {
          if (typeof item !== "object" || item === null) continue;
          const itemRecord = item as Record<string, unknown>;
          const type = typeof itemRecord.type === "string" ? itemRecord.type : "";

          if (type === "verse") {
            flushVerse();
            const verseNumber = typeof itemRecord.number === "number" ? itemRecord.number : 0;
            currentVerse = { verse: verseNumber, text: "" };
            if (Array.isArray(itemRecord.content)) {
              currentVerse.text = itemRecord.content
                .map(normalizeSegment)
                .join("");
            }
          } else if (currentVerse && type === "text") {
            currentVerse.text += normalizeSegment(itemRecord);
          }
        }

        flushVerse();
      }

      return { verses };
    }

    return { verses: [] };
  },
};

export function ScriptureSelector({ isOpen, onClose, onSelectVerses }: ScriptureSelectorProps) {
  const [stage, setStage] = useState<"translations" | "books" | "chapters" | "verses">("translations");
  const [selectedTranslation, setSelectedTranslation] = useState<Translation | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch translations on mount
  useEffect(() => {
    if (isOpen && translations.length === 0) {
      fetchTranslations();
    }
  }, [isOpen]);

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const data = await BibleAPI.getAvailableTranslations();
      setTranslations(data);
    } catch (err) {
      console.error("Failed to fetch translations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter translations based on search query
  const filteredTranslations = useMemo(() => {
    if (!searchQuery.trim()) return translations;
    return translations.filter(translation =>
      translation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (translation.englishName && translation.englishName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      translation.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [translations, searchQuery]);

  const fetchBooks = useCallback(async (translation: Translation) => {
    setLoading(true);
    try {
      const booksData = await BibleAPI.getBooks(translation.id);
      setBooks(booksData);
      setSearchQuery("");
      setSelectedTranslation(translation);
      setStage("books");
    } catch (err) {
      console.error("Failed to fetch books:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChapters = useCallback(async (book: Book) => {
    setLoading(true);
    try {
      const chapterCount = Number.isFinite(book.chapters) ? book.chapters : 0;
      const chapterList = Array.from({ length: chapterCount }, (_, i) => ({
        chapter: i + 1,
        verses: 0,
      }));
      setChapters(chapterList);
      setSelectedBook(book);
      setSearchQuery("");
      setStage("chapters");
    } catch (err) {
      console.error("Failed to fetch chapters:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVerses = useCallback(async (chapterNum: number) => {
    if (!selectedTranslation || !selectedBook) return;

    setLoading(true);
    try {
      const chapterData = await BibleAPI.getChapter(selectedTranslation.id, selectedBook.code, chapterNum);
      setVerses(chapterData.verses);
      setSelectedChapter(chapterNum);
      setStage("verses");
    } catch (err) {
      console.error("Failed to fetch verses:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTranslation, selectedBook]);

  const handleVerseToggle = (verseNum: number) => {
    const newSelected = new Set(selectedVerses);
    if (newSelected.has(verseNum)) {
      newSelected.delete(verseNum);
    } else {
      newSelected.add(verseNum);
    }
    setSelectedVerses(newSelected);
  };

  const handleConfirmSelection = () => {
    if (!selectedTranslation || !selectedBook || !selectedChapter) return;

    const selectedVerseData = Array.from(selectedVerses)
      .sort((a, b) => a - b)
      .map(verseNum => {
        const verse = verses.find(v => v.verse === verseNum);
        return {
          book: selectedBook.name,
          chapter: selectedChapter,
          verse: verseNum,
          text: verse?.text || "",
        };
      });

    onSelectVerses(selectedVerseData);
    handleClose();
  };

  const handleClose = () => {
    setStage("translations");
    setSelectedTranslation(null);
    setSelectedBook(null);
    setSelectedChapter(null);
    setSelectedVerses(new Set());
    setSearchQuery("");
    onClose();
  };

  const handleBack = () => {
    if (stage === "verses") {
      setStage("chapters");
      setSelectedVerses(new Set());
    } else if (stage === "chapters") {
      setStage("books");
      setSelectedChapter(null);
    } else if (stage === "books") {
      setStage("translations");
      setSelectedBook(null);
      setSearchQuery("");
    }
  };

  if (!isOpen) return null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#800517]/80 font-semibold">
              {stage === "translations" && "Choose Translation"}
              {stage === "books" && "Choose Book"}
              {stage === "chapters" && "Choose Chapter"}
              {stage === "verses" && "Select Verses"}
            </p>
            {stage !== "translations" && (
              <p className="text-xs text-slate-500 mt-1">
                {selectedTranslation?.name}
                {selectedBook && ` • ${selectedBook.name}`}
                {selectedChapter && ` • Chapter ${selectedChapter}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800517]"></div>
            </div>
          ) : (
            <>
              {stage === "translations" && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      placeholder="Search translations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl border-slate-200 focus:border-[#800517]"
                    />
                  </div>

                  {/* Translations List - Scrollable */}
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredTranslations.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No translations found matching "{searchQuery}"
                      </div>
                    ) : (
                      filteredTranslations.map((translation) => (
                        <button
                          key={translation.id}
                          onClick={() => fetchBooks(translation)}
                          className="w-full p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#800517] hover:bg-red-50 transition-all text-left"
                        >
                          <p className="font-semibold text-slate-900">{translation.name}</p>
                          {translation.englishName && translation.englishName !== translation.name && (
                            <p className="text-sm text-slate-600 mt-1">{translation.englishName}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">{translation.id}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {stage === "books" && (
                <div className="space-y-4">
                  <Input
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl border-slate-200 focus:border-[#800517]"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {books
                      .filter((book) =>
                        book.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((book, index) => (
                        <button
                          key={`${book.code ?? book.name}-${index}`}
                          onClick={() => fetchChapters(book)}
                          className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-[#800517] hover:bg-red-50 transition-all text-left"
                        >
                          <p className="font-semibold text-sm text-slate-900">{book.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{book.chapters} chapters</p>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {stage === "chapters" && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.chapter}
                      onClick={() => fetchVerses(chapter.chapter)}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#800517] hover:bg-red-50 transition-all text-sm font-semibold text-slate-700"
                    >
                      {chapter.chapter}
                    </button>
                  ))}
                </div>
              )}

              {stage === "verses" && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {verses.map((verse) => (
                    <button
                      key={verse.verse}
                      onClick={() => handleVerseToggle(verse.verse)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                        selectedVerses.has(verse.verse)
                          ? "border-[#800517] bg-red-50"
                          : "border-slate-200 bg-white hover:border-[#800517]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-[#800517] text-sm">{verse.verse}</p>
                          <p className="text-slate-700 text-sm mt-1 whitespace-pre-wrap break-words">{verse.text}</p>
                        </div>
                        {selectedVerses.has(verse.verse) && (
                          <div className="h-5 w-5 rounded-full bg-[#800517] flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-white flex gap-2 justify-between">
          {stage !== "translations" && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Back
            </Button>
          )}

          {stage === "verses" ? (
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedVerses.size === 0}
              className="bg-[#800517] hover:bg-[#A31F34] text-white ml-auto"
            >
              Add {selectedVerses.size > 0 ? `${selectedVerses.size} Verse${selectedVerses.size > 1 ? 's' : ''}` : 'Verses'} to Message
            </Button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
}
