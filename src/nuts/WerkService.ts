import workersNuts from "./workers";

/**
 * Houder van werk te doen meta data in threads.
 * Bij veranderingen van werk te doen wordt kraak-worker meta data geupdate.
 * Onderdeel van oplossen probleem: staat van thread nu in thread bijhouden, of op kraak-worker? kraak-worker is opvraagbaarder door controller. thread zelf heeft die info ook nodig. Oplossing: meta (waaronder werklijst) in kraak-workerinfo en louter werklijst in thread & bij update post naar kraak-worker.
 * 
 * @method telTeDoen telt taken
 * @method eersteUitLijst getter, geeft voorste taak en update takenlijst
 * @method achteraandelijst setter, plaatst taak achteraan.
 * @class WerkService
 * @template T zodat de taken getyped zijn... en allen van hetzelfde type :o
 */
export default class WerkService<T> {
  private _teDoen : T[] = [];

  constructor(init?: T[]){
    if (init) {this.teDoen = init}
    
  }

  public telTeDoen() : number {
    return this._teDoen.length
  }
  public get teDoen() : T[] {
    return this._teDoen;
  }
  public set teDoen(teDoen: T[]) {
    this._teDoen = teDoen;
    this.updateWorkerMeta();
  }
  public eersteUitLijst(): T | undefined {
    // shift op de private te Doen want die is canonical.
    const eersteTaak = this._teDoen.shift();
    this.updateWorkerMeta();  
    return eersteTaak;
  }
  public achteraanDeLijst(werk: T) : void{
    this._teDoen.push(werk);
  }
  /**
   * Aangeroepen indien _teDoen veranderd.
   * muteert via meta type message de workerTheadMeta op kraak-worker
   */  
  private updateWorkerMeta() : void{
    workersNuts.meta({werkTeDoen: this.teDoen});    
    
  }
}