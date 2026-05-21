"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { PageGrid } from "@/components/common/PageGrid";
import { SideNav } from "@/components/features/SideNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  AlertCircle,
  BookOpen,
  Library,
} from "lucide-react";

interface Translation {
  id: string;
  name: string;
  englishName?: string;
  language?: string;
}

interface RawBook {
  name: string;
  id: string;
  numberOfChapters: number;
  testament?: string;
}

interface Book {
  name: string;
  slug: string;
  chapters: number;
  testament?: string;
}

interface Verse {
  verse: number;
  text: string;
}

interface ChapterContent {
  verses: Verse[];
  chapter: number;
  book: string;
  translation?: string;
}

interface Bookmark {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  timestamp: number;
}

interface VerseSelection {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
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

  getBooks: async (translationId: string): Promise<RawBook[]> => {
    const data = await fetchJSON<{ books: RawBook[] }>(ENDPOINTS.books(translationId));
    return data.books || [];
  },

  getChapter: async (
    translationId: string,
    bookSlug: string,
    chapter: number
  ): Promise<ChapterContent> => {
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
            const verseNumber = typeof itemRecord.number === "number" ? itemRecord.number : NaN;
            const textParts = Array.isArray(itemRecord.content)
              ? itemRecord.content.map(normalizeSegment)
              : [];
            currentVerse = {
              verse: Number.isFinite(verseNumber) ? verseNumber : 0,
              text: textParts.join(""),
            };
          } else if (type === "heading") {
            // Keep headings separate from verse text; ignore for verse-only view.
            continue;
          } else if (type === "line_break") {
            if (currentVerse) {
              currentVerse.text += "\n";
            }
          }
        }

        flushVerse();
      }

      if (verses.length > 0) {
        return {
          verses,
          chapter,
          book: bookSlug,
          translation: translationId,
        };
      }

      const maybeVerses = Array.isArray(record["verses"])
        ? (record["verses"] as Verse[])
        : undefined;

      if (Array.isArray(maybeVerses)) {
        return {
          verses: maybeVerses,
          chapter,
          book: bookSlug,
          translation: translationId,
        };
      }
    }

    console.warn("Unexpected chapter response structure:", data);
    return {
      verses: [],
      chapter,
      book: bookSlug,
      translation: translationId,
    };
  },
};

const ShimmerSkeleton = () => (
  <div className="space-y-4">
    <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg w-1/3 animate-pulse"></div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="h-24 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-xl animate-pulse"
        ></div>
      ))}
    </div>
  </div>
);

const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white shadow-sm">
    <CardContent className="p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Content</h3>
      <p className="text-red-600 mb-6 max-w-md mx-auto whitespace-pre-wrap">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md"
      >
        Try Again
      </button>
    </CardContent>
  </Card>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-16 bg-white rounded-xl shadow-sm">
    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <BookOpen className="h-10 w-10 text-slate-400" />
    </div>
    <p className="text-slate-500 text-lg">{message}</p>
  </div>
);

const popularTranslationIds = ["KJV", "NIV", "NLT", "ESV", "BSB", "MSG"];

export default function LibraryPage() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [translationSearchQuery, setTranslationSearchQuery] = useState("");
  const [selectedTranslation, setSelectedTranslation] = useState<string>("");
  const [isBooksModalOpen, setIsBooksModalOpen] = useState(false);
  const [bibleBooks, setBibleBooks] = useState<Book[]>([]);
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testamentFilter, setTestamentFilter] = useState<"all" | "ot" | "nt">("all");
  const [viewingContent, setViewingContent] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<VerseSelection | null>(null);
  const [showVerseActions, setShowVerseActions] = useState(false);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bible-bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (error) {
        console.error('Failed to parse bookmarks from localStorage:', error);
      }
    }
  }, []);

  // Save bookmarks to localStorage whenever bookmarks change
  useEffect(() => {
    localStorage.setItem('bible-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    const fetchResources = async () => {
      setLoadingResources(true);
      setError(null);
      try {
        const trans = await BibleAPI.getAvailableTranslations();
        const sortedTranslations = [...trans].sort((a, b) => {
          const aIsPopular = popularTranslationIds.includes(a.id);
          const bIsPopular = popularTranslationIds.includes(b.id);
          if (aIsPopular && !bIsPopular) return -1;
          if (!aIsPopular && bIsPopular) return 1;
          return a.name.localeCompare(b.name);
        });
        setTranslations(sortedTranslations);
        if (sortedTranslations.length > 0) {
          setSelectedTranslation(sortedTranslations[0].id);
        } else {
          setError("No translations available.");
        }
      } catch {
        setError("Failed to load resources.");
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, []);

  const fetchBooks = useCallback(async (translationId: string) => {
    if (!translationId) return;
    setLoadingBooks(true);
    setError(null);
    try {
      const rawBooks = await BibleAPI.getBooks(translationId);
      setBibleBooks(
        rawBooks.map((raw) => ({
          name: raw.name,
          slug: raw.id,
          chapters: raw.numberOfChapters,
          testament: raw.testament,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books.");
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  const fetchContent = useCallback(async () => {
    if (!selectedBook || !selectedTranslation || selectedChapter === null) return;
    setLoadingContent(true);
    setError(null);
    try {
      const data = await BibleAPI.getChapter(
        selectedTranslation,
        selectedBook.slug,
        selectedChapter
      );
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chapter.");
    } finally {
      setLoadingContent(false);
    }
  }, [selectedBook, selectedChapter, selectedTranslation]);

  useEffect(() => {
    if (selectedBook && selectedChapter !== null && selectedTranslation) {
      fetchContent();
    }
  }, [selectedBook, selectedChapter, selectedTranslation, fetchContent]);

  const selectedTranslationDetails = translations.find(
    (translation) => translation.id === selectedTranslation
  );

  const filteredTranslations = useMemo(() => {
    const query = translationSearchQuery.trim().toLowerCase();

    const filtered = query
      ? translations.filter(
          (translation) =>
            translation.name.toLowerCase().includes(query) ||
            translation.id.toLowerCase().includes(query)
        )
      : translations;

    return filtered.sort((a, b) => {
      const aIsPopular = popularTranslationIds.includes(a.id);
      const bIsPopular = popularTranslationIds.includes(b.id);
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [translations, translationSearchQuery]);

  const getTestamentId = (testament?: string) => {
    if (!testament) return "other";
    const lower = testament.toLowerCase();
    if (lower.includes("old") || lower === "ot") return "ot";
    if (lower.includes("new") || lower === "nt") return "nt";
    return "other";
  };

  const filteredBooks = useMemo(() => {
    const normalizedSearch = bookSearchQuery.trim().toLowerCase();
    const bySearch = normalizedSearch
      ? bibleBooks.filter((book) => book.name.toLowerCase().includes(normalizedSearch))
      : bibleBooks;

    if (testamentFilter === "all") return bySearch;
    return bySearch.filter((book) => getTestamentId(book.testament) === testamentFilter);
  }, [bibleBooks, bookSearchQuery, testamentFilter]);

  const openBooksModal = async (translationId: string) => {
    setSelectedTranslation(translationId);
    setBookSearchQuery("");
    setTestamentFilter("all");
    setSelectedBook(null);
    setSelectedChapter(null);
    setContent(null);
    setViewingContent(false);
    setIsBooksModalOpen(true);
    setBibleBooks([]);
    await fetchBooks(translationId);
  };

  const closeBooksModal = () => {
    setIsBooksModalOpen(false);
  };

  const openChapterModal = (book: Book) => {
    setSelectedBook(book);
    setIsChapterModalOpen(true);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setIsChapterModalOpen(false);
    setIsBooksModalOpen(false); // Close both modals when chapter is selected
    setViewingContent(true);
  };

  const handleVerseClick = (verse: Verse) => {
    if (!selectedBook || !selectedTranslation || selectedChapter === null) return;

    setSelectedVerse({
      book: selectedBook.name,
      chapter: selectedChapter,
      verse: verse.verse,
      text: verse.text,
      translation: selectedTranslation,
    });
    setShowVerseActions(true);
  };

  const handleCopyVerse = async () => {
    if (!selectedVerse) return;

    const verseText = `${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse} (${selectedVerse.translation})\n"${selectedVerse.text}"`;

    try {
      await navigator.clipboard.writeText(verseText);
      // You could add a toast notification here
      console.log('Verse copied to clipboard');
    } catch (error) {
      console.error('Failed to copy verse:', error);
    }

    setShowVerseActions(false);
    setSelectedVerse(null);
  };

  const handleBookmarkVerse = () => {
    if (!selectedVerse) return;

    const bookmarkId = `${selectedVerse.translation}-${selectedVerse.book}-${selectedVerse.chapter}-${selectedVerse.verse}`;

    // Check if already bookmarked
    const existingBookmark = bookmarks.find(b => b.id === bookmarkId);
    if (existingBookmark) {
      // Remove bookmark
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } else {
      // Add bookmark
      const newBookmark: Bookmark = {
        id: bookmarkId,
        book: selectedVerse.book,
        chapter: selectedVerse.chapter,
        verse: selectedVerse.verse,
        text: selectedVerse.text,
        translation: selectedVerse.translation,
        timestamp: Date.now(),
      };
      setBookmarks(prev => [...prev, newBookmark]);
    }

    setShowVerseActions(false);
    setSelectedVerse(null);
  };

  const isVerseBookmarked = (book: string, chapter: number, verse: number, translation: string) => {
    const bookmarkId = `${translation}-${book}-${chapter}-${verse}`;
    return bookmarks.some(b => b.id === bookmarkId);
  };

  const closeVerseActions = () => {
    setShowVerseActions(false);
    setSelectedVerse(null);
  };

  const closeChapterModal = () => {
    setIsChapterModalOpen(false);
  };

  const handleClearBookSearch = () => {
    setBookSearchQuery("");
  };

  const chapterOptions = useMemo(() => {
    if (!selectedBook) return [];
    return Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
  }, [selectedBook]);

  const renderContent = () => {
    if (loadingContent) {
      return (
        <div className="space-y-3 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          {[...Array(12)].map((_, i) => (
            <div key={`verse-skeleton-${i}`} className="flex gap-3">
              <div className="w-8 h-4 bg-slate-200 rounded"></div>
              <div className="flex-1 h-4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!content) {
      if (selectedBook && selectedChapter === null) {
        return <EmptyState message="Select a chapter from the modal to begin reading." />;
      }
      return <EmptyState message="Choose a translation and book to begin reading." />;
    }

    if (!content.verses || !Array.isArray(content.verses)) {
      console.error("Invalid content structure:", content);
      return (
        <EmptyState message="The chapter data is malformed. Please try another translation." />
      );
    }

    if (content.verses.length === 0) {
      return <EmptyState message="This chapter has no content available." />;
    }

    return (
      <div className="prose prose-slate max-w-none">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#800517]" />
                {selectedBook?.name} {selectedChapter}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {selectedTranslationDetails?.name || selectedTranslation}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsBooksModalOpen(true)}>
                Change Book
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsChapterModalOpen(true)}>
                Change Chapter
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  if (selectedBook && selectedChapter !== null && selectedChapter < selectedBook.chapters) {
                    setSelectedChapter(selectedChapter + 1);
                  }
                }}
                disabled={!selectedBook || !selectedChapter || selectedChapter >= (selectedBook?.chapters || 0)}
                className="bg-[#800517] hover:bg-[#A31F34]"
              >
                Next Chapter →
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          {content.verses.map((verse, idx) => {
            const isBookmarked = isVerseBookmarked(
              selectedBook?.name || '',
              selectedChapter || 0,
              verse.verse,
              selectedTranslation
            );

            return (
              <div
                key={verse.verse}
                className={`group relative flex gap-3 p-3 rounded-2xl transition-all cursor-pointer ${
                  idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100/50"
                }`}
                onClick={() => handleVerseClick(verse)}
              >
                <span className="text-[#800517] font-bold text-sm min-w-[2rem] pt-0.5 flex items-center gap-1">
                  {verse.verse}
                  {isBookmarked && (
                    <div className="w-2 h-2 bg-amber-400 rounded-full" title="Bookmarked" />
                  )}
                </span>
                <p className="text-slate-700 leading-relaxed flex-1">{verse.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-20 md:pb-0">
      <Header />
      <PageGrid
        left={<SideNav />}
        centerFullWidth={true}
        center={
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-lg rounded-2xl overflow-hidden relative min-h-[300px] bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/60" />
              <CardContent className="relative z-10 p-8 md:p-10 flex flex-col items-center text-center text-white">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-5 border border-white/20">
                  <Library className="h-10 w-10" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight drop-shadow-lg">Sacred Library</h1>
                <p className="text-white/90 max-w-md text-lg drop-shadow-md">
                  Discover timeless wisdom. Select a translation, explore sacred texts, and find inspiration in every verse.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="space-y-6 p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-[#800517]" />
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-[#800517]/80 font-semibold">Search Translations</p>
                      <p className="mt-2 text-slate-600">Search and select the Bible translation that you want to open.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search translation..."
                      value={translationSearchQuery}
                      onChange={(e) => setTranslationSearchQuery(e.target.value)}
                      className="rounded-xl bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-[#800517]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTranslationSearchQuery((value) => value.trim())}
                      className="whitespace-nowrap"
                    >
                      Search
                    </Button>
                  </div>
                </div>

                {loadingResources ? (
                  <ShimmerSkeleton />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredTranslations.map((translation) => (
                      <button
                        key={translation.id}
                        type="button"
                        onClick={() => openBooksModal(translation.id)}
                        className={`group rounded-3xl border p-4 text-left transition-all duration-200 ${
                          selectedTranslation === translation.id
                            ? "bg-gradient-to-br from-[#800517] to-[#A31F34] text-white shadow-lg"
                            : "bg-white text-slate-700 hover:bg-slate-50 shadow-sm border-slate-200"
                        }`}
                      >
                        <div className="text-sm font-semibold truncate">{translation.name}</div>
                        <p className="text-xs mt-1 text-slate-500">{translation.id}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-xl bg-white overflow-hidden">
              <CardContent className="p-6 md:p-8">
                {viewingContent ? renderContent() : <EmptyState message="Select a translation and book to open the reader page." />}
              </CardContent>
            </Card>

            {isBooksModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
                <div className="w-full max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-[#800517]/80 font-semibold">Books</p>
                      <p className="text-xs text-slate-500">Books for {selectedTranslation}</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeBooksModal}
                      className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>
                  <div className="border-b border-slate-100 p-5">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <div className="relative">
                        <Input
                          placeholder="Search books..."
                          value={bookSearchQuery}
                          onChange={(e) => setBookSearchQuery(e.target.value)}
                          className="rounded-xl bg-slate-50 border-slate-200"
                        />
                        {bookSearchQuery && (
                          <button
                            type="button"
                            onClick={handleClearBookSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant={testamentFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTestamentFilter("all")}
                        >
                          All
                        </Button>
                        <Button
                          variant={testamentFilter === "ot" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTestamentFilter("ot")}
                        >
                          Old Testament
                        </Button>
                        <Button
                          variant={testamentFilter === "nt" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTestamentFilter("nt")}
                        >
                          New Testament
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-5">
                    {loadingBooks ? (
                      <ShimmerSkeleton />
                    ) : error && !bibleBooks.length ? (
                      <ErrorState message={error} onRetry={() => fetchBooks(selectedTranslation)} />
                    ) : filteredBooks.length === 0 ? (
                      <EmptyState message="No books match your search." />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filteredBooks.map((book) => (
                          <button
                            key={book.slug}
                            type="button"
                            onClick={() => openChapterModal(book)}
                            className="group rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#800517] hover:bg-[#fff8f7]"
                          >
                            <div className="font-semibold text-base truncate">{book.name}</div>
                            <p className="mt-2 text-xs text-slate-500">{book.chapters} chapters</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isChapterModalOpen && selectedBook && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
                <div className="w-full max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-[#800517]/80 font-semibold">{selectedBook.name}</p>
                      <p className="text-xs text-slate-500">Select the chapter you want to read.</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeChapterModal}
                      className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-5">
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {chapterOptions.map((chapter) => (
                        <button
                          key={chapter}
                          type="button"
                          onClick={() => handleChapterSelect(chapter)}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#800517] hover:bg-[#fff6f5]"
                        >
                          Chapter {chapter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Verse Actions Modal */}
      {showVerseActions && selectedVerse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#800517]/80 font-semibold">Verse Actions</p>
                <p className="text-xs text-slate-500">
                  {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                </p>
              </div>
              <button
                type="button"
                onClick={closeVerseActions}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                "{selectedVerse.text}"
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleCopyVerse}
                  className="flex-1 bg-[#800517] hover:bg-[#A31F34] text-white"
                >
                  📋 Copy
                </Button>
                <Button
                  onClick={handleBookmarkVerse}
                  variant="outline"
                  className="flex-1 border-[#800517] text-[#800517] hover:bg-[#800517] hover:text-white"
                >
                  {isVerseBookmarked(
                    selectedVerse.book,
                    selectedVerse.chapter,
                    selectedVerse.verse,
                    selectedVerse.translation
                  ) ? '⭐ Remove Bookmark' : '☆ Bookmark'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
