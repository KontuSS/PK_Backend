aktywacja bazy: **docker exec -it match-db psql -U app -d appdb**
aktualne struktury bazy znajdują się w schema.sql bedzie to ulegało zmienom na bierząco 
aby wprowadzic struktury należy uruchomic dockera wiadomo
i wpisac w termianl : **docker cp .\schema.sql match-db:/tmp/schema.sql**
następnie: **docker exec -it match-db psql -U app -d appdb -f /tmp/schema.sql**
i teścik: **docker exec -it match-db psql -U app -d appdb -c '\dt'**
ustawiony port dockerowy: 5432
datkowo w backendzie znajdują się początki struktur w dot necie o tyle o ile dockera coś znam
dotnet i cały backend to frrestyle chta gpt i stacka więc zobaczysz co się przyda 



etapy do zrobienia zaleznie od potrzeb : 
dodac plik który będzie doddawał dummy dane po paru kmendach
stworzenie lepszej dokumentacji i sformalizować powiązania w bazie 
dalsze modyfikacje bazy w miarę potrzeb