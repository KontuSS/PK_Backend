niektóre komendy wykonujemy raz później wszystko zapisuje się w obrazie dockerowym
w folderze SQL_HELPERS znajdują się 4 pliki .sql 

AppDB.sql--> ładuje strukturę tabel do bazy postgresowej **docker exec -it match-db psql -U app -d appdb -f /temp/SQL_HELPERS/AppDB.sql**
Dummy_Data_AppDB.sql--> zawiera przykładowe dane potrzebne przy pracy z bazą aplikacji **docker exec -it match-db psql -U app -d appdb -f /temp/SQL_HELPERS/Dummy_Data_AppDB.sql**
Clean_AppDB.sql--> czyści wszystkie dane z bazy danych **docker exec -it match-db psql -U app -d appdb -f /temp/SQL_HELPERS/Clean_AppDB.sql**
Drop_AppDB.sql--> zrzuca wszystkie tabele całą strukturę bazy danych **docker exec -it match-db psql -U app -d appdb -f /temp/SQL_HELPERS/Drop_AppDB.sql**


aktualne struktury bazy znajdują się w AppDB.sql bedzie to ulegało zmienom na bierząco 
aby wprowadzic struktury należy uruchomic dockera wiadomo

i teścik: **docker exec -it match-db psql -U app -d appdb -c '\dt'**
ustawiony port dockerowy: 5432
datkowo w backendzie znajdują się początki struktur w dot necie o tyle o ile dockera coś znam
dotnet i cały backend to frrestyle chta gpt i stacka więc zobaczysz co się przyda 

 docker exec -it match-db psql -U app -d appdb -f /tmp/AppDB.sql schemat wykonania pliku

TODO: 
~~dodac plik który będzie doddawał dummy dane po paru kmendach~~
~~dodać plik oraz komende która wyczyści wszystki dane przykładowe z tabel~~
~~stworzenie lepszej dokumentacji i sformalizować powiązania w bazie~~ 
dalsze modyfikacje bazy w miarę potrzeb