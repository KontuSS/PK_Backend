using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace AntiplagiarismSystem
{
    // Klasa odpowiedzialna za tokenizację kodu
    public class CodeTokenizer
    {
        // Tokenizacja kodu C/C++
        public string TokenizeCCpp(string code)
        {
            // Usuwanie komentarzy
            code = Regex.Replace(code, @"//.*|/\*[\s\S]*?\*/", "");
            
            // Usuwanie białych znaków
            code = Regex.Replace(code, @"\s+", " ");
            
            // Tokenizacja podstawowych struktur
            var tokens = new List<string>();
            var tokenRegex = new Regex(@"(#\w+|struct|class|enum|if|else|while|for|do|switch|case|return|break|continue)|\b\w+\b|[{}()\[\];,.<>?:=+\-*/&|^!~%]");
            
            var matches = tokenRegex.Matches(code);
            foreach (Match match in matches)
            {
                tokens.Add(match.Value);
            }
            
            return string.Join(" ", tokens);
        }
        
        // Tokenizacja kodu PHP (podobna implementacja)
        public string TokenizePhp(string code) { /* implementacja */ }
        
        // Tokenizacja kodu Python (podobna implementacja)
        public string TokenizePython(string code) { /* implementacja */ }
        
        // Normalizacja sekwencji tokenów
        public string NormalizeTokens(string tokenSequence)
        {
            var normalizedTokens = new List<string>();
            var identifierMap = new Dictionary<string, string>();
            var nextIdentifierId = 1;
            
            var tokens = tokenSequence.Split(' ');
            foreach (var token in tokens)
            {
                if (Regex.IsMatch(token, @"^\w+$") && !IsKeyword(token))
                {
                    if (!identifierMap.ContainsKey(token))
                    {
                        identifierMap[token] = $"ID{nextIdentifierId++}";
                    }
                    normalizedTokens.Add(identifierMap[token]);
                }
                else
                {
                    normalizedTokens.Add(token);
                }
            }
            
            return string.Join(" ", normalizedTokens);
        }
        
        private bool IsKeyword(string token) { /* implementacja */ }
    }

    // Klasa odpowiedzialna za wykrywanie plagiatów
    public class PlagiarismDetector
    {
        private readonly AntiplagiarismDbContext _dbContext;
        private readonly CodeTokenizer _tokenizer;
        
        public PlagiarismDetector(AntiplagiarismDbContext dbContext, CodeTokenizer tokenizer)
        {
            _dbContext = dbContext;
            _tokenizer = tokenizer;
        }
        
        // Tokenizacja i zapisanie kodu
        public async Task TokenizeAndSaveCode(CodeSubmission submission)
        {
            string tokenSequence = "";
            
            // Tokenizacja zależna od języka
            switch (submission.Language.ToLower())
            {
                case "c": case "cpp": case "c++":
                    tokenSequence = _tokenizer.TokenizeCCpp(submission.CodeContent);
                    break;
                case "php":
                    tokenSequence = _tokenizer.TokenizePhp(submission.CodeContent);
                    break;
                case "python": case "py":
                    tokenSequence = _tokenizer.TokenizePython(submission.CodeContent);
                    break;
                default:
                    throw new ArgumentException($"Nieobsługiwany język: {submission.Language}");
            }
            
            // Normalizacja tokenów
            var normalizedTokenSequence = _tokenizer.NormalizeTokens(tokenSequence);
            
            // Zapisanie tokenizacji w bazie danych
            var tokenizedCode = new TokenizedCode
            {
                CodeId = submission.Id,
                TokenSequence = tokenSequence,
                NormalizedTokenSequence = normalizedTokenSequence
            };
            
            // Obliczenie hasha znormalizowanej sekwencji tokenów
            submission.TokenHash = ComputeHash(normalizedTokenSequence);
            
            _dbContext.TokenizedCodes.Add(tokenizedCode);
            await _dbContext.SaveChangesAsync();
        }
        
        // Obliczenie hasha dla sekwencji tokenów
        private string ComputeHash(string tokenSequence) { /* implementacja */ }
        
        // Wykrywanie plagiatów dla konkretnego kodu
        public async Task<List<ComparisonResult>> DetectPlagiarism(int codeId, double similarityThreshold = 0.7)
        {
            var results = new List<ComparisonResult>();
            
            // Pobranie oryginalnego kodu
            var originalCode = await _dbContext.CodeSubmissions
                .Include(c => c.TokenizedCodes)
                .FirstOrDefaultAsync(c => c.Id == codeId);
                
            if (originalCode == null || !originalCode.TokenizedCodes.Any())
            {
                throw new ArgumentException($"Kod o ID {codeId} nie został znaleziony lub nie jest tokenizowany");
            }
            
            var originalNormalizedTokens = originalCode.TokenizedCodes.First().NormalizedTokenSequence;
            
            // Pobranie wszystkich innych kodów do porównania
            var codesToCompare = await _dbContext.CodeSubmissions
                .Include(c => c.TokenizedCodes)
                .Where(c => c.Id != codeId && c.TokenizedCodes.Any())
                .ToListAsync();
            
            foreach (var code in codesToCompare)
            {
                var comparedNormalizedTokens = code.TokenizedCodes.First().NormalizedTokenSequence;
                
                // Obliczenie podobieństwa przy użyciu algorytmu Greedy String Tiling
                var similarity = CalculateSimilarity(originalNormalizedTokens, comparedNormalizedTokens);
                
                if (similarity >= similarityThreshold)
                {
                    // Zapisanie wyniku porównania
                    // ...
                }
            }
            
            return results;
        }
        
        // Implementacja algorytmu Greedy String Tiling
        private double CalculateSimilarity(string sequence1, string sequence2)
        {
            var tokens1 = sequence1.Split(' ');
            var tokens2 = sequence2.Split(' ');
            
            int matchedTokens = 0;
            bool[] marked1 = new bool[tokens1.Length];
            bool[] marked2 = new bool[tokens2.Length];
            
            // Minimalna długość ciągu do dopasowania
            int minMatchLength = 3;
            
            bool matchFound;
            do
            {
                matchFound = false;
                
                // Znajdowanie najdłuższego wspólnego podciągu
                for (int i = 0; i < tokens1.Length - minMatchLength + 1; i++)
                {
                    if (marked1[i]) continue;
                    
                    for (int j = 0; j < tokens2.Length - minMatchLength + 1; j++)
                    {
                        if (marked2[j]) continue;
                        
                        // Sprawdzenie czy podciągi są identyczne
                        int matchLength = 0;
                        while (i + matchLength < tokens1.Length && 
                               j + matchLength < tokens2.Length && 
                               tokens1[i + matchLength] == tokens2[j + matchLength] &&
                               !marked1[i + matchLength] && 
                               !marked2[j + matchLength])
                        {
                            matchLength++;
                        }
                        
                        // Jeśli znaleziono wystarczająco długi podciąg
                        if (matchLength >= minMatchLength)
                        {
                            // Oznaczenie dopasowanych tokenów
                            for (int k = 0; k < matchLength; k++)
                            {
                                marked1[i + k] = true;
                                marked2[j + k] = true;
                            }
                            
                            matchedTokens += matchLength;
                            matchFound = true;
                        }
                    }
                }
            } while (matchFound);
            
            // Obliczenie współczynnika podobieństwa
            return (2.0 * matchedTokens) / (tokens1.Length + tokens2.Length);
        }
        
        // Rekursywne sprawdzenie wszystkich kodów w danym katalogu i podkatalogach
        public async Task<List<ComparisonResult>> DetectPlagiarismRecursively(string folderPath, double similarityThreshold = 0.7)
        {
            // Implementacja podobna do DetectPlagiarism, ale dla wszystkich kodów w katalogu
            // ...
        }
    }
}
