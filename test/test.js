var assert = require('assert');
var expect = require('chai').expect;

const gate = require('../src/gate.js');
const circuit = require('../src/circuit.js');
const Label = require('../src/lib/label.js');
const {Garbler, Evaluator, bin2hex, hex2bin} = require('../src/jigg');

var and4_bristol = "3 7\n4 1\n1 1\n2 1 0 1 4 AND\n2 1 2 3 5 AND\n2 1 4 5 6 AND";
var and4_json = {
  "gates": 3, "wires": 7,
  "input": [1, 2, 3, 4], "output": [7],
  "gate": [
    {"type": "and", "wirein": [1,2], "wireout": 5},
    {"type": "and", "wirein": [3,4], "wireout": 6},
    {"type": "and", "wirein": [5,6], "wireout": 7}
  ]
};

var add32_bristol = "375 439\n2 32\n1 33\n2 1 0 32 406 XOR\n2 1 5 37 373 AND\n2 1 4 36 336 AND\n2 1 10 42 340 AND\n2 1 14 46 366 AND\n2 1 24 56 341 AND\n2 1 8 40 342 AND\n2 1 1 33 343 AND\n2 1 7 39 348 AND\n2 1 28 60 349 AND\n2 1 19 51 350 AND\n2 1 2 34 351 AND\n2 1 30 62 364 AND\n2 1 13 45 352 AND\n2 1 18 50 353 AND\n2 1 11 43 355 AND\n2 1 3 35 356 AND\n2 1 16 48 359 AND\n2 1 31 63 357 AND\n2 1 27 59 358 AND\n2 1 15 47 360 AND\n2 1 17 49 361 AND\n2 1 9 41 363 AND\n2 1 32 0 278 AND\n2 1 29 61 362 AND\n2 1 6 38 365 AND\n2 1 25 57 354 AND\n2 1 20 52 367 AND\n2 1 22 54 331 AND\n2 1 21 53 371 AND\n2 1 12 44 372 AND\n2 1 23 55 339 AND\n2 1 26 58 368 AND\n1 1 56 398 INV\n1 1 3 314 INV\n1 1 40 346 INV\n1 1 62 378 INV\n1 1 6 389 INV\n1 1 28 401 INV\n1 1 10 377 INV\n1 1 13 391 INV\n1 1 27 335 INV\n1 1 7 387 INV\n1 1 24 399 INV\n1 1 54 327 INV\n1 1 36 315 INV\n1 1 52 332 INV\n1 1 50 380 INV\n1 1 57 404 INV\n1 1 31 323 INV\n1 1 55 317 INV\n1 1 18 381 INV\n1 1 60 400 INV\n1 1 5 322 INV\n1 1 14 395 INV\n1 1 47 402 INV\n1 1 8 347 INV\n1 1 19 385 INV\n1 1 53 374 INV\n1 1 29 330 INV\n1 1 1 382 INV\n1 1 34 344 INV\n1 1 20 333 INV\n1 1 37 321 INV\n1 1 45 390 INV\n1 1 11 338 INV\n1 1 42 376 INV\n1 1 12 370 INV\n1 1 38 388 INV\n1 1 23 318 INV\n1 1 41 392 INV\n1 1 61 329 INV\n1 1 15 403 INV\n1 1 48 396 INV\n1 1 26 320 INV\n1 1 43 337 INV\n1 1 59 334 INV\n1 1 9 393 INV\n1 1 58 319 INV\n1 1 17 326 INV\n1 1 44 369 INV\n1 1 21 375 INV\n1 1 49 325 INV\n1 1 16 397 INV\n1 1 25 405 INV\n1 1 51 384 INV\n1 1 4 316 INV\n1 1 2 345 INV\n1 1 39 386 INV\n1 1 46 394 INV\n1 1 35 313 INV\n1 1 22 328 INV\n1 1 63 324 INV\n1 1 33 383 INV\n1 1 30 379 INV\n2 1 313 314 282 AND\n2 1 315 316 283 AND\n2 1 317 318 284 AND\n2 1 319 320 299 AND\n2 1 321 322 285 AND\n2 1 323 324 286 AND\n2 1 325 326 288 AND\n2 1 327 328 289 AND\n2 1 329 330 290 AND\n1 1 331 130 INV\n2 1 332 333 287 AND\n2 1 334 335 292 AND\n1 1 336 256 INV\n2 1 337 338 293 AND\n1 1 339 123 INV\n1 1 340 214 INV\n1 1 341 116 INV\n1 1 342 228 INV\n1 1 343 276 INV\n2 1 344 345 310 AND\n2 1 346 347 300 AND\n1 1 348 235 INV\n1 1 349 88 INV\n1 1 350 151 INV\n1 1 351 270 INV\n1 1 352 193 INV\n1 1 353 158 INV\n1 1 354 109 INV\n1 1 355 207 INV\n1 1 356 263 INV\n1 1 357 66 INV\n1 1 358 95 INV\n1 1 359 172 INV\n1 1 360 179 INV\n1 1 361 165 INV\n1 1 362 81 INV\n1 1 363 221 INV\n1 1 364 74 INV\n1 1 365 242 INV\n1 1 366 186 INV\n1 1 367 144 INV\n1 1 368 102 INV\n2 1 369 370 301 AND\n1 1 371 137 INV\n1 1 372 200 INV\n1 1 373 249 INV\n2 1 374 375 298 AND\n2 1 376 377 296 AND\n2 1 378 379 291 AND\n2 1 380 381 297 AND\n2 1 382 383 306 AND\n2 1 384 385 294 AND\n2 1 386 387 295 AND\n2 1 388 389 302 AND\n2 1 390 391 303 AND\n2 1 392 393 304 AND\n2 1 394 395 305 AND\n2 1 396 397 307 AND\n2 1 398 399 308 AND\n2 1 400 401 309 AND\n2 1 402 403 311 AND\n2 1 404 405 312 AND\n1 1 282 266 INV\n1 1 283 259 INV\n1 1 284 126 INV\n1 1 285 252 INV\n1 1 286 69 INV\n1 1 287 147 INV\n1 1 288 168 INV\n1 1 289 133 INV\n1 1 290 84 INV\n1 1 291 77 INV\n1 1 292 98 INV\n1 1 293 210 INV\n1 1 294 154 INV\n1 1 295 238 INV\n1 1 296 217 INV\n1 1 297 161 INV\n1 1 298 140 INV\n1 1 299 105 INV\n1 1 300 231 INV\n1 1 301 203 INV\n1 1 302 245 INV\n1 1 303 196 INV\n1 1 304 224 INV\n1 1 305 189 INV\n1 1 306 281 INV\n1 1 307 175 INV\n1 1 308 119 INV\n1 1 309 91 INV\n1 1 310 273 INV\n1 1 311 182 INV\n1 1 312 112 INV\n2 1 281 276 277 AND\n2 1 69 66 279 AND\n2 1 281 278 280 AND\n2 1 277 278 407 XOR\n1 1 279 71 INV\n1 1 280 275 INV\n2 1 275 276 274 AND\n1 1 274 271 INV\n2 1 2 271 268 XOR\n2 1 271 273 272 AND\n2 1 34 268 408 XOR\n1 1 272 269 INV\n2 1 269 270 267 AND\n1 1 267 264 INV\n2 1 3 264 261 XOR\n2 1 264 266 265 AND\n2 1 35 261 409 XOR\n1 1 265 262 INV\n2 1 262 263 260 AND\n1 1 260 257 INV\n2 1 4 257 253 XOR\n2 1 257 259 258 AND\n2 1 36 253 410 XOR\n1 1 258 255 INV\n2 1 255 256 254 AND\n1 1 254 250 INV\n2 1 5 250 247 XOR\n2 1 250 252 251 AND\n2 1 37 247 411 XOR\n1 1 251 248 INV\n2 1 248 249 246 AND\n1 1 246 243 INV\n2 1 6 243 239 XOR\n2 1 243 245 244 AND\n2 1 38 239 412 XOR\n1 1 244 241 INV\n2 1 241 242 240 AND\n1 1 240 236 INV\n2 1 7 236 233 XOR\n2 1 236 238 237 AND\n2 1 39 233 413 XOR\n1 1 237 234 INV\n2 1 234 235 232 AND\n1 1 232 229 INV\n2 1 8 229 226 XOR\n2 1 229 231 230 AND\n2 1 40 226 414 XOR\n1 1 230 227 INV\n2 1 227 228 225 AND\n1 1 225 222 INV\n2 1 9 222 219 XOR\n2 1 222 224 223 AND\n2 1 41 219 415 XOR\n1 1 223 220 INV\n2 1 220 221 218 AND\n1 1 218 215 INV\n2 1 10 215 212 XOR\n2 1 215 217 216 AND\n2 1 42 212 416 XOR\n1 1 216 213 INV\n2 1 213 214 211 AND\n1 1 211 208 INV\n2 1 11 208 205 XOR\n2 1 208 210 209 AND\n2 1 43 205 417 XOR\n1 1 209 206 INV\n2 1 206 207 204 AND\n1 1 204 201 INV\n2 1 12 201 198 XOR\n2 1 201 203 202 AND\n2 1 44 198 418 XOR\n1 1 202 199 INV\n2 1 199 200 197 AND\n1 1 197 195 INV\n2 1 13 195 190 XOR\n2 1 195 196 194 AND\n2 1 45 190 419 XOR\n1 1 194 192 INV\n2 1 192 193 191 AND\n1 1 191 187 INV\n2 1 14 187 183 XOR\n2 1 187 189 188 AND\n2 1 46 183 420 XOR\n1 1 188 185 INV\n2 1 185 186 184 AND\n1 1 184 180 INV\n2 1 15 180 177 XOR\n2 1 180 182 181 AND\n2 1 47 177 421 XOR\n1 1 181 178 INV\n2 1 178 179 176 AND\n1 1 176 173 INV\n2 1 48 173 170 XOR\n2 1 173 175 174 AND\n2 1 16 170 422 XOR\n1 1 174 171 INV\n2 1 171 172 169 AND\n1 1 169 166 INV\n2 1 17 166 163 XOR\n2 1 166 168 167 AND\n2 1 49 163 423 XOR\n1 1 167 164 INV\n2 1 164 165 162 AND\n1 1 162 159 INV\n2 1 18 159 156 XOR\n2 1 159 161 160 AND\n2 1 50 156 424 XOR\n1 1 160 157 INV\n2 1 157 158 155 AND\n1 1 155 152 INV\n2 1 19 152 149 XOR\n2 1 152 154 153 AND\n2 1 51 149 425 XOR\n1 1 153 150 INV\n2 1 150 151 148 AND\n1 1 148 145 INV\n2 1 20 145 141 XOR\n2 1 145 147 146 AND\n2 1 52 141 426 XOR\n1 1 146 143 INV\n2 1 143 144 142 AND\n1 1 142 138 INV\n2 1 53 138 135 XOR\n2 1 138 140 139 AND\n2 1 21 135 427 XOR\n1 1 139 136 INV\n2 1 136 137 134 AND\n1 1 134 132 INV\n2 1 22 132 127 XOR\n2 1 132 133 131 AND\n2 1 54 127 428 XOR\n1 1 131 129 INV\n2 1 129 130 128 AND\n1 1 128 124 INV\n2 1 23 124 121 XOR\n2 1 124 126 125 AND\n2 1 55 121 429 XOR\n1 1 125 122 INV\n2 1 122 123 120 AND\n1 1 120 117 INV\n2 1 24 117 114 XOR\n2 1 117 119 118 AND\n2 1 56 114 430 XOR\n1 1 118 115 INV\n2 1 115 116 113 AND\n1 1 113 110 INV\n2 1 25 110 107 XOR\n2 1 110 112 111 AND\n2 1 57 107 431 XOR\n1 1 111 108 INV\n2 1 108 109 106 AND\n1 1 106 103 INV\n2 1 26 103 100 XOR\n2 1 103 105 104 AND\n2 1 58 100 432 XOR\n1 1 104 101 INV\n2 1 101 102 99 AND\n1 1 99 96 INV\n2 1 59 96 93 XOR\n2 1 96 98 97 AND\n2 1 27 93 433 XOR\n1 1 97 94 INV\n2 1 94 95 92 AND\n1 1 92 89 INV\n2 1 28 89 86 XOR\n2 1 89 91 90 AND\n2 1 60 86 434 XOR\n1 1 90 87 INV\n2 1 87 88 85 AND\n1 1 85 83 INV\n2 1 61 83 79 XOR\n2 1 83 84 82 AND\n2 1 29 79 435 XOR\n1 1 82 80 INV\n2 1 80 81 78 AND\n1 1 78 76 INV\n2 1 30 76 72 XOR\n2 1 76 77 75 AND\n2 1 62 72 436 XOR\n1 1 75 73 INV\n2 1 73 74 70 AND\n2 1 70 71 437 XOR\n1 1 70 68 INV\n2 1 68 69 67 AND\n1 1 67 65 INV\n2 1 65 66 64 AND\n1 1 64 438 INV"
var add32_json = {
  "wires":439,
  "gates":375,
  "input":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64],
  "output":[407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439],
  "gate":[
    {"wirein":[1,33], "wireout":407, "type":"xor"},
    {"wirein":[6,38], "wireout":374, "type":"and"},
    {"wirein":[5,37], "wireout":337, "type":"and"},
    {"wirein":[11,43], "wireout":341, "type":"and"},
    {"wirein":[15,47], "wireout":367, "type":"and"},
    {"wirein":[25,57], "wireout":342, "type":"and"},
    {"wirein":[9,41], "wireout":343, "type":"and"},
    {"wirein":[2,34], "wireout":344, "type":"and"},
    {"wirein":[8,40], "wireout":349, "type":"and"},
    {"wirein":[29,61], "wireout":350, "type":"and"},
    {"wirein":[20,52], "wireout":351, "type":"and"},
    {"wirein":[3,35], "wireout":352, "type":"and"},
    {"wirein":[31,63], "wireout":365, "type":"and"},
    {"wirein":[14,46], "wireout":353, "type":"and"},
    {"wirein":[19,51], "wireout":354, "type":"and"},
    {"wirein":[12,44], "wireout":356, "type":"and"},
    {"wirein":[4,36], "wireout":357, "type":"and"},
    {"wirein":[17,49], "wireout":360, "type":"and"},
    {"wirein":[32,64], "wireout":358, "type":"and"},
    {"wirein":[28,60], "wireout":359, "type":"and"},
    {"wirein":[16,48], "wireout":361, "type":"and"},
    {"wirein":[18,50], "wireout":362, "type":"and"},
    {"wirein":[10,42], "wireout":364, "type":"and"},
    {"wirein":[33,1], "wireout":279, "type":"and"},
    {"wirein":[30,62], "wireout":363, "type":"and"},
    {"wirein":[7,39], "wireout":366, "type":"and"},
    {"wirein":[26,58], "wireout":355, "type":"and"},
    {"wirein":[21,53], "wireout":368, "type":"and"},
    {"wirein":[23,55], "wireout":332, "type":"and"},
    {"wirein":[22,54], "wireout":372, "type":"and"},
    {"wirein":[13,45], "wireout":373, "type":"and"},
    {"wirein":[24,56], "wireout":340, "type":"and"},
    {"wirein":[27,59], "wireout":369, "type":"and"},
    {"wirein":[57], "wireout":399, "type":"not"},
    {"wirein":[4], "wireout":315, "type":"not"},
    {"wirein":[41], "wireout":347, "type":"not"},
    {"wirein":[63], "wireout":379, "type":"not"},
    {"wirein":[7], "wireout":390, "type":"not"},
    {"wirein":[29], "wireout":402, "type":"not"},
    {"wirein":[11], "wireout":378, "type":"not"},
    {"wirein":[14], "wireout":392, "type":"not"},
    {"wirein":[28], "wireout":336, "type":"not"},
    {"wirein":[8], "wireout":388, "type":"not"},
    {"wirein":[25], "wireout":400, "type":"not"},
    {"wirein":[55], "wireout":328, "type":"not"},
    {"wirein":[37], "wireout":316, "type":"not"},
    {"wirein":[53], "wireout":333, "type":"not"},
    {"wirein":[51], "wireout":381, "type":"not"},
    {"wirein":[58], "wireout":405, "type":"not"},
    {"wirein":[32], "wireout":324, "type":"not"},
    {"wirein":[56], "wireout":318, "type":"not"},
    {"wirein":[19], "wireout":382, "type":"not"},
    {"wirein":[61], "wireout":401, "type":"not"},
    {"wirein":[6], "wireout":323, "type":"not"},
    {"wirein":[15], "wireout":396, "type":"not"},
    {"wirein":[48], "wireout":403, "type":"not"},
    {"wirein":[9], "wireout":348, "type":"not"},
    {"wirein":[20], "wireout":386, "type":"not"},
    {"wirein":[54], "wireout":375, "type":"not"},
    {"wirein":[30], "wireout":331, "type":"not"},
    {"wirein":[2], "wireout":383, "type":"not"},
    {"wirein":[35], "wireout":345, "type":"not"},
    {"wirein":[21], "wireout":334, "type":"not"},
    {"wirein":[38], "wireout":322, "type":"not"},
    {"wirein":[46], "wireout":391, "type":"not"},
    {"wirein":[12], "wireout":339, "type":"not"},
    {"wirein":[43], "wireout":377, "type":"not"},
    {"wirein":[13], "wireout":371, "type":"not"},
    {"wirein":[39], "wireout":389, "type":"not"},
    {"wirein":[24], "wireout":319, "type":"not"},
    {"wirein":[42], "wireout":393, "type":"not"},
    {"wirein":[62], "wireout":330, "type":"not"},
    {"wirein":[16], "wireout":404, "type":"not"},
    {"wirein":[49], "wireout":397, "type":"not"},
    {"wirein":[27], "wireout":321, "type":"not"},
    {"wirein":[44], "wireout":338, "type":"not"},
    {"wirein":[60], "wireout":335, "type":"not"},
    {"wirein":[10], "wireout":394, "type":"not"},
    {"wirein":[59], "wireout":320, "type":"not"},
    {"wirein":[18], "wireout":327, "type":"not"},
    {"wirein":[45], "wireout":370, "type":"not"},
    {"wirein":[22], "wireout":376, "type":"not"},
    {"wirein":[50], "wireout":326, "type":"not"},
    {"wirein":[17], "wireout":398, "type":"not"},
    {"wirein":[26], "wireout":406, "type":"not"},
    {"wirein":[52], "wireout":385, "type":"not"},
    {"wirein":[5], "wireout":317, "type":"not"},
    {"wirein":[3], "wireout":346, "type":"not"},
    {"wirein":[40], "wireout":387, "type":"not"},
    {"wirein":[47], "wireout":395, "type":"not"},
    {"wirein":[36], "wireout":314, "type":"not"},
    {"wirein":[23], "wireout":329, "type":"not"},
    {"wirein":[64], "wireout":325, "type":"not"},
    {"wirein":[34], "wireout":384, "type":"not"},
    {"wirein":[31], "wireout":380, "type":"not"},
    {"wirein":[314,315], "wireout":283, "type":"and"},
    {"wirein":[316,317], "wireout":284, "type":"and"},
    {"wirein":[318,319], "wireout":285, "type":"and"},
    {"wirein":[320,321], "wireout":300, "type":"and"},
    {"wirein":[322,323], "wireout":286, "type":"and"},
    {"wirein":[324,325], "wireout":287, "type":"and"},
    {"wirein":[326,327], "wireout":289, "type":"and"},
    {"wirein":[328,329], "wireout":290, "type":"and"},
    {"wirein":[330,331], "wireout":291, "type":"and"},
    {"wirein":[332], "wireout":131, "type":"not"},
    {"wirein":[333,334], "wireout":288, "type":"and"},
    {"wirein":[335,336], "wireout":293, "type":"and"},
    {"wirein":[337], "wireout":257, "type":"not"},
    {"wirein":[338,339], "wireout":294, "type":"and"},
    {"wirein":[340], "wireout":124, "type":"not"},
    {"wirein":[341], "wireout":215, "type":"not"},
    {"wirein":[342], "wireout":117, "type":"not"},
    {"wirein":[343], "wireout":229, "type":"not"},
    {"wirein":[344], "wireout":277, "type":"not"},
    {"wirein":[345,346], "wireout":311, "type":"and"},
    {"wirein":[347,348], "wireout":301, "type":"and"},
    {"wirein":[349], "wireout":236, "type":"not"},
    {"wirein":[350], "wireout":89, "type":"not"},
    {"wirein":[351], "wireout":152, "type":"not"},
    {"wirein":[352], "wireout":271, "type":"not"},
    {"wirein":[353], "wireout":194, "type":"not"},
    {"wirein":[354], "wireout":159, "type":"not"},
    {"wirein":[355], "wireout":110, "type":"not"},
    {"wirein":[356], "wireout":208, "type":"not"},
    {"wirein":[357], "wireout":264, "type":"not"},
    {"wirein":[358], "wireout":67, "type":"not"},
    {"wirein":[359], "wireout":96, "type":"not"},
    {"wirein":[360], "wireout":173, "type":"not"},
    {"wirein":[361], "wireout":180, "type":"not"},
    {"wirein":[362], "wireout":166, "type":"not"},
    {"wirein":[363], "wireout":82, "type":"not"},
    {"wirein":[364], "wireout":222, "type":"not"},
    {"wirein":[365], "wireout":75, "type":"not"},
    {"wirein":[366], "wireout":243, "type":"not"},
    {"wirein":[367], "wireout":187, "type":"not"},
    {"wirein":[368], "wireout":145, "type":"not"},
    {"wirein":[369], "wireout":103, "type":"not"},
    {"wirein":[370,371], "wireout":302, "type":"and"},
    {"wirein":[372], "wireout":138, "type":"not"},
    {"wirein":[373], "wireout":201, "type":"not"},
    {"wirein":[374], "wireout":250, "type":"not"},
    {"wirein":[375,376], "wireout":299, "type":"and"},
    {"wirein":[377,378], "wireout":297, "type":"and"},
    {"wirein":[379,380], "wireout":292, "type":"and"},
    {"wirein":[381,382], "wireout":298, "type":"and"},
    {"wirein":[383,384], "wireout":307, "type":"and"},
    {"wirein":[385,386], "wireout":295, "type":"and"},
    {"wirein":[387,388], "wireout":296, "type":"and"},
    {"wirein":[389,390], "wireout":303, "type":"and"},
    {"wirein":[391,392], "wireout":304, "type":"and"},
    {"wirein":[393,394], "wireout":305, "type":"and"},
    {"wirein":[395,396], "wireout":306, "type":"and"},
    {"wirein":[397,398], "wireout":308, "type":"and"},
    {"wirein":[399,400], "wireout":309, "type":"and"},
    {"wirein":[401,402], "wireout":310, "type":"and"},
    {"wirein":[403,404], "wireout":312, "type":"and"},
    {"wirein":[405,406], "wireout":313, "type":"and"},
    {"wirein":[283], "wireout":267, "type":"not"},
    {"wirein":[284], "wireout":260, "type":"not"},
    {"wirein":[285], "wireout":127, "type":"not"},
    {"wirein":[286], "wireout":253, "type":"not"},
    {"wirein":[287], "wireout":70, "type":"not"},
    {"wirein":[288], "wireout":148, "type":"not"},
    {"wirein":[289], "wireout":169, "type":"not"},
    {"wirein":[290], "wireout":134, "type":"not"},
    {"wirein":[291], "wireout":85, "type":"not"},
    {"wirein":[292], "wireout":78, "type":"not"},
    {"wirein":[293], "wireout":99, "type":"not"},
    {"wirein":[294], "wireout":211, "type":"not"},
    {"wirein":[295], "wireout":155, "type":"not"},
    {"wirein":[296], "wireout":239, "type":"not"},
    {"wirein":[297], "wireout":218, "type":"not"},
    {"wirein":[298], "wireout":162, "type":"not"},
    {"wirein":[299], "wireout":141, "type":"not"},
    {"wirein":[300], "wireout":106, "type":"not"},
    {"wirein":[301], "wireout":232, "type":"not"},
    {"wirein":[302], "wireout":204, "type":"not"},
    {"wirein":[303], "wireout":246, "type":"not"},
    {"wirein":[304], "wireout":197, "type":"not"},
    {"wirein":[305], "wireout":225, "type":"not"},
    {"wirein":[306], "wireout":190, "type":"not"},
    {"wirein":[307], "wireout":282, "type":"not"},
    {"wirein":[308], "wireout":176, "type":"not"},
    {"wirein":[309], "wireout":120, "type":"not"},
    {"wirein":[310], "wireout":92, "type":"not"},
    {"wirein":[311], "wireout":274, "type":"not"},
    {"wirein":[312], "wireout":183, "type":"not"},
    {"wirein":[313], "wireout":113, "type":"not"},
    {"wirein":[282,277], "wireout":278, "type":"and"},
    {"wirein":[70,67], "wireout":280, "type":"and"},
    {"wirein":[282,279], "wireout":281, "type":"and"},
    {"wirein":[278,279], "wireout":408, "type":"xor"},
    {"wirein":[280], "wireout":72, "type":"not"},
    {"wirein":[281], "wireout":276, "type":"not"},
    {"wirein":[276,277], "wireout":275, "type":"and"},
    {"wirein":[275], "wireout":272, "type":"not"},
    {"wirein":[3,272], "wireout":269, "type":"xor"},
    {"wirein":[272,274], "wireout":273, "type":"and"},
    {"wirein":[35,269], "wireout":409, "type":"xor"},
    {"wirein":[273], "wireout":270, "type":"not"},
    {"wirein":[270,271], "wireout":268, "type":"and"},
    {"wirein":[268], "wireout":265, "type":"not"},
    {"wirein":[4,265], "wireout":262, "type":"xor"},
    {"wirein":[265,267], "wireout":266, "type":"and"},
    {"wirein":[36,262], "wireout":410, "type":"xor"},
    {"wirein":[266], "wireout":263, "type":"not"},
    {"wirein":[263,264], "wireout":261, "type":"and"},
    {"wirein":[261], "wireout":258, "type":"not"},
    {"wirein":[5,258], "wireout":254, "type":"xor"},
    {"wirein":[258,260], "wireout":259, "type":"and"},
    {"wirein":[37,254], "wireout":411, "type":"xor"},
    {"wirein":[259], "wireout":256, "type":"not"},
    {"wirein":[256,257], "wireout":255, "type":"and"},
    {"wirein":[255], "wireout":251, "type":"not"},
    {"wirein":[6,251], "wireout":248, "type":"xor"},
    {"wirein":[251,253], "wireout":252, "type":"and"},
    {"wirein":[38,248], "wireout":412, "type":"xor"},
    {"wirein":[252], "wireout":249, "type":"not"},
    {"wirein":[249,250], "wireout":247, "type":"and"},
    {"wirein":[247], "wireout":244, "type":"not"},
    {"wirein":[7,244], "wireout":240, "type":"xor"},
    {"wirein":[244,246], "wireout":245, "type":"and"},
    {"wirein":[39,240], "wireout":413, "type":"xor"},
    {"wirein":[245], "wireout":242, "type":"not"},
    {"wirein":[242,243], "wireout":241, "type":"and"},
    {"wirein":[241], "wireout":237, "type":"not"},
    {"wirein":[8,237], "wireout":234, "type":"xor"},
    {"wirein":[237,239], "wireout":238, "type":"and"},
    {"wirein":[40,234], "wireout":414, "type":"xor"},
    {"wirein":[238], "wireout":235, "type":"not"},
    {"wirein":[235,236], "wireout":233, "type":"and"},
    {"wirein":[233], "wireout":230, "type":"not"},
    {"wirein":[9,230], "wireout":227, "type":"xor"},
    {"wirein":[230,232], "wireout":231, "type":"and"},
    {"wirein":[41,227], "wireout":415, "type":"xor"},
    {"wirein":[231], "wireout":228, "type":"not"},
    {"wirein":[228,229], "wireout":226, "type":"and"},
    {"wirein":[226], "wireout":223, "type":"not"},
    {"wirein":[10,223], "wireout":220, "type":"xor"},
    {"wirein":[223,225], "wireout":224, "type":"and"},
    {"wirein":[42,220], "wireout":416, "type":"xor"},
    {"wirein":[224], "wireout":221, "type":"not"},
    {"wirein":[221,222], "wireout":219, "type":"and"},
    {"wirein":[219], "wireout":216, "type":"not"},
    {"wirein":[11,216], "wireout":213, "type":"xor"},
    {"wirein":[216,218], "wireout":217, "type":"and"},
    {"wirein":[43,213], "wireout":417, "type":"xor"},
    {"wirein":[217], "wireout":214, "type":"not"},
    {"wirein":[214,215], "wireout":212, "type":"and"},
    {"wirein":[212], "wireout":209, "type":"not"},
    {"wirein":[12,209], "wireout":206, "type":"xor"},
    {"wirein":[209,211], "wireout":210, "type":"and"},
    {"wirein":[44,206], "wireout":418, "type":"xor"},
    {"wirein":[210], "wireout":207, "type":"not"},
    {"wirein":[207,208], "wireout":205, "type":"and"},
    {"wirein":[205], "wireout":202, "type":"not"},
    {"wirein":[13,202], "wireout":199, "type":"xor"},
    {"wirein":[202,204], "wireout":203, "type":"and"},
    {"wirein":[45,199], "wireout":419, "type":"xor"},
    {"wirein":[203], "wireout":200, "type":"not"},
    {"wirein":[200,201], "wireout":198, "type":"and"},
    {"wirein":[198], "wireout":196, "type":"not"},
    {"wirein":[14,196], "wireout":191, "type":"xor"},
    {"wirein":[196,197], "wireout":195, "type":"and"},
    {"wirein":[46,191], "wireout":420, "type":"xor"},
    {"wirein":[195], "wireout":193, "type":"not"},
    {"wirein":[193,194], "wireout":192, "type":"and"},
    {"wirein":[192], "wireout":188, "type":"not"},
    {"wirein":[15,188], "wireout":184, "type":"xor"},
    {"wirein":[188,190], "wireout":189, "type":"and"},
    {"wirein":[47,184], "wireout":421, "type":"xor"},
    {"wirein":[189], "wireout":186, "type":"not"},
    {"wirein":[186,187], "wireout":185, "type":"and"},
    {"wirein":[185], "wireout":181, "type":"not"},
    {"wirein":[16,181], "wireout":178, "type":"xor"},
    {"wirein":[181,183], "wireout":182, "type":"and"},
    {"wirein":[48,178], "wireout":422, "type":"xor"},
    {"wirein":[182], "wireout":179, "type":"not"},
    {"wirein":[179,180], "wireout":177, "type":"and"},
    {"wirein":[177], "wireout":174, "type":"not"},
    {"wirein":[49,174], "wireout":171, "type":"xor"},
    {"wirein":[174,176], "wireout":175, "type":"and"},
    {"wirein":[17,171], "wireout":423, "type":"xor"},
    {"wirein":[175], "wireout":172, "type":"not"},
    {"wirein":[172,173], "wireout":170, "type":"and"},
    {"wirein":[170], "wireout":167, "type":"not"},
    {"wirein":[18,167], "wireout":164, "type":"xor"},
    {"wirein":[167,169], "wireout":168, "type":"and"},
    {"wirein":[50,164], "wireout":424, "type":"xor"},
    {"wirein":[168], "wireout":165, "type":"not"},
    {"wirein":[165,166], "wireout":163, "type":"and"},
    {"wirein":[163], "wireout":160, "type":"not"},
    {"wirein":[19,160], "wireout":157, "type":"xor"},
    {"wirein":[160,162], "wireout":161, "type":"and"},
    {"wirein":[51,157], "wireout":425, "type":"xor"},
    {"wirein":[161], "wireout":158, "type":"not"},
    {"wirein":[158,159], "wireout":156, "type":"and"},
    {"wirein":[156], "wireout":153, "type":"not"},
    {"wirein":[20,153], "wireout":150, "type":"xor"},
    {"wirein":[153,155], "wireout":154, "type":"and"},
    {"wirein":[52,150], "wireout":426, "type":"xor"},
    {"wirein":[154], "wireout":151, "type":"not"},
    {"wirein":[151,152], "wireout":149, "type":"and"},
    {"wirein":[149], "wireout":146, "type":"not"},
    {"wirein":[21,146], "wireout":142, "type":"xor"},
    {"wirein":[146,148], "wireout":147, "type":"and"},
    {"wirein":[53,142], "wireout":427, "type":"xor"},
    {"wirein":[147], "wireout":144, "type":"not"},
    {"wirein":[144,145], "wireout":143, "type":"and"},
    {"wirein":[143], "wireout":139, "type":"not"},
    {"wirein":[54,139], "wireout":136, "type":"xor"},
    {"wirein":[139,141], "wireout":140, "type":"and"},
    {"wirein":[22,136], "wireout":428, "type":"xor"},
    {"wirein":[140], "wireout":137, "type":"not"},
    {"wirein":[137,138], "wireout":135, "type":"and"},
    {"wirein":[135], "wireout":133, "type":"not"},
    {"wirein":[23,133], "wireout":128, "type":"xor"},
    {"wirein":[133,134], "wireout":132, "type":"and"},
    {"wirein":[55,128], "wireout":429, "type":"xor"},
    {"wirein":[132], "wireout":130, "type":"not"},
    {"wirein":[130,131], "wireout":129, "type":"and"},
    {"wirein":[129], "wireout":125, "type":"not"},
    {"wirein":[24,125], "wireout":122, "type":"xor"},
    {"wirein":[125,127], "wireout":126, "type":"and"},
    {"wirein":[56,122], "wireout":430, "type":"xor"},
    {"wirein":[126], "wireout":123, "type":"not"},
    {"wirein":[123,124], "wireout":121, "type":"and"},
    {"wirein":[121], "wireout":118, "type":"not"},
    {"wirein":[25,118], "wireout":115, "type":"xor"},
    {"wirein":[118,120], "wireout":119, "type":"and"},
    {"wirein":[57,115], "wireout":431, "type":"xor"},
    {"wirein":[119], "wireout":116, "type":"not"},
    {"wirein":[116,117], "wireout":114, "type":"and"},
    {"wirein":[114], "wireout":111, "type":"not"},
    {"wirein":[26,111], "wireout":108, "type":"xor"},
    {"wirein":[111,113], "wireout":112, "type":"and"},
    {"wirein":[58,108], "wireout":432, "type":"xor"},
    {"wirein":[112], "wireout":109, "type":"not"},
    {"wirein":[109,110], "wireout":107, "type":"and"},
    {"wirein":[107], "wireout":104, "type":"not"},
    {"wirein":[27,104], "wireout":101, "type":"xor"},
    {"wirein":[104,106], "wireout":105, "type":"and"},
    {"wirein":[59,101], "wireout":433, "type":"xor"},
    {"wirein":[105], "wireout":102, "type":"not"},
    {"wirein":[102,103], "wireout":100, "type":"and"},
    {"wirein":[100], "wireout":97, "type":"not"},
    {"wirein":[60,97], "wireout":94, "type":"xor"},
    {"wirein":[97,99], "wireout":98, "type":"and"},
    {"wirein":[28,94], "wireout":434, "type":"xor"},
    {"wirein":[98], "wireout":95, "type":"not"},
    {"wirein":[95,96], "wireout":93, "type":"and"},
    {"wirein":[93], "wireout":90, "type":"not"},
    {"wirein":[29,90], "wireout":87, "type":"xor"},
    {"wirein":[90,92], "wireout":91, "type":"and"},
    {"wirein":[61,87], "wireout":435, "type":"xor"},
    {"wirein":[91], "wireout":88, "type":"not"},
    {"wirein":[88,89], "wireout":86, "type":"and"},
    {"wirein":[86], "wireout":84, "type":"not"},
    {"wirein":[62,84], "wireout":80, "type":"xor"},
    {"wirein":[84,85], "wireout":83, "type":"and"},
    {"wirein":[30,80], "wireout":436, "type":"xor"},
    {"wirein":[83], "wireout":81, "type":"not"},
    {"wirein":[81,82], "wireout":79, "type":"and"},
    {"wirein":[79], "wireout":77, "type":"not"},
    {"wirein":[31,77], "wireout":73, "type":"xor"},
    {"wirein":[77,78], "wireout":76, "type":"and"},
    {"wirein":[63,73], "wireout":437, "type":"xor"},
    {"wirein":[76], "wireout":74, "type":"not"},
    {"wirein":[74,75], "wireout":71, "type":"and"},
    {"wirein":[71,72], "wireout":438, "type":"xor"},
    {"wirein":[71], "wireout":69, "type":"not"},
    {"wirein":[69,70], "wireout":68, "type":"and"},
    {"wirein":[68], "wireout":66, "type":"not"},
    {"wirein":[66,67], "wireout":65, "type":"and"},
    {"wirein":[65], "wireout":439, "type":"not"}
  ]
};

// The unit tests below do not require a cryptographic library.
describe('parser', function() {
  describe('#circuit_parse_bristol()', function () {
    it('circuit_parse_bristol', function() {
      expect(circuit.circuit_parse_bristol(and4_bristol).toJSON()).to.eql(and4_json);
      expect(circuit.circuit_parse_bristol(add32_bristol).toJSON()).to.eql(add32_json);
    });
  });
});

// The unit tests below require libsodium.
global.sodium = require('libsodium-wrappers');
(async() => {
  await sodium.ready; // Wait for libsodium to load.

  describe('Garbler', function() {

    var input1 = "00000001";
    var input2 = "00000001";
    var output = "080000000";

    input1 = hex2bin(input1);
    input1 = input1.split('').reverse().map(JSON.parse);

    input2 = hex2bin(input2);
    input2 = input2.split('').reverse().map(JSON.parse);

    //input1 = "11".split('');
    //input2 = "11".split('');
    //var circuit = and4_json;
    
    input1 = "00000000000000000000000000000101".split('');
    input2 = "00000000000000000000000000001010".split('');
    var circuit = add32_json;

    var Wire_G = Garbler.prototype.generate_labels(circuit);
    var ggates = Garbler.prototype.garble_gates(circuit, Wire_G);
    //console.log(ggates);
    
    const input_G = (new Array(1)).concat(input1).concat(new Array(input1.length));
    var give = {};
    var send = {};
    // Give the evaluator the first half of the input labels.
    for (var i = 0; i < circuit.input.length/2; i++) {
      var j = circuit.input[i]; // Index of ith input gate.
      give['Wire'+j] = Wire_G[j][(input_G[j] == 0) ? 0 : 1];
    }
    // Use oblivious transfer for the second half of the input labels.
    for (var i = circuit.input.length/2; i < circuit.input.length; i++) {
      var j = circuit.input[i]; // Index of ith input gate.
      send[i] = [Wire_G[j][0], Wire_G[j][1]];
    }

    const input_E = (new Array(1 + input2.length)).concat(input2);
    var messages = [null];
    // Each of the garbler's input labels.
    for (var i = 0; i < circuit.input.length / 2; i++)
      messages.push(give['Wire' + circuit.input[i]]);
    // Promises to each of the evaluator's input labels.
    for (var i = circuit.input.length / 2; i < circuit.input.length; i++) {
      messages.push(send[i][input_E[circuit.input[i]]]);
    }

    var Wire_E = Evaluator.prototype.initialize_labels(circuit);
    for (var i = 0 ; i < circuit.input.length; i++) {
      var j = circuit.input[i];
      Wire_E[j] = Label(messages[j]);
    }

    var Wire_E2 = Evaluator.prototype.evaluate_gates(circuit, Wire_E, ggates);
    var evaluation = {};
    for (var i = 0; i < circuit.output.length; i++) {
      var j = circuit.output[i];
      evaluation[j] = Wire_E2[j].stringify();
    }

    var results = [];
    for (var i = 0; i < circuit.output.length; i++) {
      var label = evaluation[circuit.output[i]]; // Wire output label.
      var states = Wire_G[circuit.output[i]].map(Label.prototype.stringify); // True and false labels.
      var value = states.map(function (e) { return e.substring(0, e.length-3); }).indexOf(label.substring(0, label.length-3)); // Find which state the label represents.
      results.push(value);
    }
    console.log(results.join(''));

});

})(); // End async() for libsodium.
