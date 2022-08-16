class Vectoor3 {

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone() {
        return new Vectoor3(this.x, this.y, this.z);
    }

    inverse() {
        // return new Vector3(-this.x, -this.y, -this.z);
        this.x = 0 - this.x;
        this.y = 0 - this.y;
        this.z = 0 - this.z;

    }

    add(vec) {
        // return new Vector3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
        this.x += vec.x
        this.y += vec.y
        this.z += vec.z
    }

    sub(vec) {
        // return new Vector3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
        this.x -= vec.x
        this.y -= vec.y
        this.z -= vec.z
    }

    scalarProduct(n) {
        return new Vectoor3(n * this.x, n * this.y, n * this.z);
    }

    dotProduct(vec) {
        return (this.x * vec.x) + (this.y * vec.y) + (this.z * vec.z);
    }
    
    crossProduct(vec) {
        var result = new Vectoor3();
        result.x = (this.y * vec.z) - (this.z * vec.y);
        result.y = (this.x * vec.z) - (this.z * vec.x);
        result.z = (this.x * vec.y) - (this.y * vec.x);
        return result;
    }

    calcMagnitude() {
        return Math.sqrt(this.dotProduct(this));
    }

    calcMagnitudeSq() {
        return this.dotProduct(this);
    }

    calcNormalizedVector() {
        return this.scalarProduct((1 / this.calcMagnitude()));
    }

}
export {Vectoor3}