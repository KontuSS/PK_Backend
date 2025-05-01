
# Dokumentacja Systemu Antyplagiatowego
(na ten moment to tylko propozycja wykonania tego elementu projektu)przy rzeczach do zmiany dopracowaniua zostawiam symbol **TODO**
## 📌 Przegląd Systemu
System antyplagiatowy dla aplikacji kodowej wykorzystuje **tokenizację kodu** i [**algorytm Greedy String Tiling (GST)**](https://www.researchgate.net/profile/Michael_Wise/publication/262763983_String_Similarity_via_Greedy_String_Tiling_and_Running_Karp-Rabin_Matching/links/59f03226aca272a2500141f4/String-Similarity-via-Greedy-String-Tiling-and-Running-Karp-Rabin-Matching.pdf) do wykrywania podobieństw między kodami źródłowymi. Obsługuje języki **C/C++, PHP, Python(do zwiekszenia ilosci)** oraz strukturę **zagnieżdżonych katalogów**.

---

## 🔧 Mechanizm Działania

### 1. Tokenizacja i Normalizacja Kodu
#### Kroki Przetwarzania Kodu:
1. **Usunięcie komentarzy i białych znaków**  
**TODO** zmienic jednolitosc usuwania komentarzy na rozna ze wzgledu na uzywany jezyk programowania
   ```
   code = Regex.Replace(code, @"//.*|/\*[\s\S]*?\*/", ""); // Usuwanie komentarzy
   code = Regex.Replace(code, @"\s+", " "); // Usuwanie nadmiarowych spacji
   ```
2. **Tokenizacja**  
   Kod jest dzielony na tokeny (słowa kluczowe, operatory, identyfikatory).
**TODO**Podac przyklad jak to jest robione 
3. **Normalizacja identyfikatorów**  
   Nazwy zmiennych/funkcji są zastępowane generycznymi znacznikami (np. `ID1`, `ID2`).

#### Przykład:
```
# Oryginalny kod
def calculate_sum(a, b):
    return a + b

# Po tokenizacji i normalizacji:
DEF ID1 ( ID2 , ID3 ) : RETURN ID2 + ID3
```

---

## 🗄️ Struktura Bazy Danych (PostgreSQL)
**TODO** ta tabela kompletnie do wywalenia zastepuje ja co innego
### Tabela `CodeSubmissions`
```
CREATE TABLE CodeSubmissions (
    Id SERIAL PRIMARY KEY,
    UserId INTEGER NOT NULL,
    CodeTitle VARCHAR(255) NOT NULL,
    CodeContent TEXT NOT NULL,
    Language VARCHAR(50) NOT NULL,
    FolderPath VARCHAR(512) NOT NULL,  -- Ścieżka do katalogu
    TokenHash VARCHAR(512),            -- Hash znormalizowanych tokenów
    ...
);
```
- **Indeksy**: `TokenHash`, `FolderPath` dla szybkiego wyszukiwania.
**TODO** te dwie sa potrzebne ale trzeba je zmienic
### Tabela `TokenizedCodes`
```
CREATE TABLE TokenizedCodes (
    Id SERIAL PRIMARY KEY,
    CodeId INTEGER NOT NULL,
    TokenSequence TEXT NOT NULL,          -- Sekwencja tokenów
    NormalizedTokenSequence TEXT NOT NULL -- Znormalizowane tokeny
);
```

### Tabela `ComparisonResults`
```
CREATE TABLE ComparisonResults (
    Id SERIAL PRIMARY KEY,
    Code1Id INTEGER NOT NULL,
    Code2Id INTEGER NOT NULL,
    SimilarityScore DOUBLE PRECISION NOT NULL, -- Wynik podobieństwa (0-1)
    ...
);
```

---

## ⚙️ Logika Działania Systemu 
**TODO** całe do analizy przez Kubę
cały kod znajduje się w pliku: backend/AntyPlagiat.cs
### Dodawanie Nowego Kodu
1. Użytkownik przesyła kod przez aplikację.
2. System wykonuje tokenizację i normalizację.
3. Zapisuje:
   - Kod źródłowy w `CodeSubmissions`.
   - Tokeny w `TokenizedCodes`.
   - Hash znormalizowanych tokenów w `TokenHash`.

### Wykrywanie Plagiatów
**TODO** problemik bedzie ze scierzkami
1. **Porównywanie kodów** wg ścieżki katalogu lub całej bazy.
2. **Algorytm GST** znajduje maksymalne wspólne podciągi tokenów.
3. Oblicza współczynnik podobieństwa:  
   ```
   similarity = (2 * matchedTokens) / (totalTokens1 + totalTokens2);
   ```
4. Jeśli `similarity > 0.7`, zgłaszany jest potencjalny plagiat.

#### Przykład Wyniku:
| Kod 1         | Kod 2         | Podobieństwo |
|---------------|---------------|--------------|
| `IF ID1 > 5`  | `IF X > 5`    | 85%          |

---

## 💻 Implementacja w .NET

### Klasa `CodeTokenizer`
```
public class CodeTokenizer {
    public string TokenizeCCpp(string code) { ... }
    public string NormalizeTokens(string tokenSequence) {
        // Zamiana identyfikatorów na ID1, ID2...
    }
}
```

### Klasa `PlagiarismDetector`
```
public class PlagiarismDetector {
    public async Task DetectPlagiarism(int codeId) {
        // Pobranie tokenów z bazy
        // Porównanie z innymi kodami za pomocą GST
    }
    
    private double CalculateSimilarity(...) {
        // Implementacja algorytmu GST
    }
}
```

---

## 🔗 Referencje do Istniejących Rozwiązań
1. **JPlag**  
   Repozytorium: [github.com/jplag/JPlag](https://github.com/jplag/JPlag)  
   *Wykrywa plagiaty w 20+ językach, w tym C/C++ i Python*.

2. **MOSS (Stanford)**  
   Strona: [theory.stanford.edu/~aiken/moss](https://theory.stanford.edu/~aiken/moss)  
   *Używany przez uczelnie do sprawdzania prac programistycznych*.

---

## 🎯 Podsumowanie
### Zalety Systemu
- **Niezależność od formatowania**: Wykrywa plagiaty nawet po zmianie nazw zmiennych.
- **Wydajność**: Indeksowanie `TokenHash` przyspiesza porównania.


[⬆️ Powrót na górę](#-przegląd-systemu)


